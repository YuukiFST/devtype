use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::PathBuf;
use std::sync::{Arc, Mutex, Once};

use gittype::domain::models::{ExtractionOptions, Languages};
use gittype::domain::services::config_service::ConfigServiceInterface;
use gittype::domain::services::session_manager_service::{SessionManager, SessionManagerInterface};
use gittype::domain::services::theme_service::ThemeServiceInterface;
use gittype::domain::stores::RepositoryStoreInterface;
use gittype::infrastructure::logging;
use gittype::presentation::di::AppModule;
use gittype::presentation::tui::{ScreenManagerFactory, ScreenManagerImpl, ScreenType};
use gittype::presentation::ui::view_model::palette_json;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use ratatui::backend::TestBackend;
use serde_json::{json, Value};
use shaku::HasComponent;

use crate::keys::{to_key_event, KeyInput};

/// Buffer size the screens lay out against; matches a roomy terminal so
/// scroll windows and wrapping behave as they do in gittype.
const HEADLESS_COLUMNS: u16 = 140;
const HEADLESS_ROWS: u16 = 44;

#[napi(object)]
pub struct GameOptions {
    pub repo_path: Option<String>,
    pub repo: Option<String>,
    pub langs: Option<Vec<String>>,
}

#[napi]
pub struct GameEngine {
    manager: Arc<Mutex<ScreenManagerImpl<TestBackend>>>,
    theme_service: Arc<dyn ThemeServiceInterface>,
    // Owns every component the screens hold Arcs into.
    _container: AppModule,
}

static LOGGING: Once = Once::new();

pub fn init_logging() {
    LOGGING.call_once(|| {
        if logging::setup_logging().is_err() {
            logging::setup_console_logging();
        }
        std::panic::set_hook(Box::new(|info| logging::log_panic_to_file(info)));
    });
}

fn guard<T>(what: &str, f: impl FnOnce() -> gittype::Result<T>) -> Result<T> {
    match catch_unwind(AssertUnwindSafe(f)) {
        Ok(Ok(value)) => Ok(value),
        Ok(Err(e)) => {
            logging::log_error_to_file(&e);
            Err(Error::from_reason(format!("{what}: {e}")))
        }
        Err(payload) => {
            let message = payload
                .downcast_ref::<String>()
                .cloned()
                .or_else(|| payload.downcast_ref::<&str>().map(|s| s.to_string()))
                .unwrap_or_else(|| "unknown panic".to_string());
            Err(Error::from_reason(format!("panic in {what}: {message}")))
        }
    }
}

fn wire_session_manager(container: &AppModule) {
    let session_manager: Arc<dyn SessionManagerInterface> = container.resolve();
    if session_manager
        .as_any()
        .downcast_ref::<SessionManager>()
        .is_none()
    {
        return;
    }
    // SAFETY: the downcast above proves the concrete type behind the trait
    // object is SessionManager; this mirrors gittype's run_game_session.
    let concrete =
        unsafe { Arc::from_raw(Arc::into_raw(session_manager) as *const SessionManager) };
    SessionManager::setup_event_subscriptions(concrete);
}

fn extraction_options(langs: Option<Vec<String>>) -> gittype::Result<ExtractionOptions> {
    let mut options = ExtractionOptions::default();
    if let Some(langs) = langs {
        if let Err(unsupported) = Languages::validate_languages(&langs) {
            return Err(gittype::GitTypeError::ExtractionFailed(format!(
                "Unsupported language(s): {}",
                unsupported.join(", ")
            )));
        }
        options.languages = Some(langs);
        options.apply_language_filter();
    }
    Ok(options)
}

#[napi]
impl GameEngine {
    /// Same setup as `gittype` with no subcommand: config, theme, repository
    /// parameters, then the Loading screen starts processing.
    #[napi(factory)]
    pub fn start(options: GameOptions) -> Result<Self> {
        init_logging();
        guard("start", || {
            let container = AppModule::builder().build();
            wire_session_manager(&container);

            let config_service: &dyn ConfigServiceInterface = container.resolve_ref();
            if let Err(e) = config_service.init() {
                log::warn!("Failed to initialize config service: {}", e);
            }
            let theme_service: Arc<dyn ThemeServiceInterface> = container.resolve();
            if let Err(e) = theme_service.init() {
                log::warn!("Failed to initialize theme service: {}", e);
            }

            let repository_store: &dyn RepositoryStoreInterface = container.resolve_ref();
            match options.repo {
                Some(spec) => repository_store.set_repo_spec(spec),
                None => repository_store.set_repo_path(PathBuf::from(
                    options.repo_path.unwrap_or_else(|| ".".to_string()),
                )),
            }
            repository_store.set_extraction_options(extraction_options(options.langs)?);

            let factory: &dyn ScreenManagerFactory = container.resolve_ref();
            let manager = Arc::new(Mutex::new(
                factory.create_headless(HEADLESS_COLUMNS, HEADLESS_ROWS),
            ));
            manager
                .lock()
                .unwrap()
                .set_current_screen(ScreenType::Loading)?;
            ScreenManagerImpl::setup_event_subscriptions(&manager);

            Ok(Self {
                manager,
                theme_service,
                _container: container,
            })
        })
    }

    #[napi]
    pub fn press_key(&self, key: KeyInput) -> Result<()> {
        let Some(event) = to_key_event(&key) else {
            return Ok(());
        };
        guard("press_key", || self.manager.lock().unwrap().dispatch_key(event))
    }

    /// One frame: timed updates (countdown, animation, loading), then any
    /// transition a screen or background step requested.
    #[napi]
    pub fn advance(&self) -> Result<()> {
        guard("advance", || self.manager.lock().unwrap().advance())
    }

    /// JSON text of the current screen, stack and palette. Returned as a
    /// string so the host can skip a re-render when nothing changed.
    #[napi]
    pub fn snapshot(&self) -> Result<String> {
        guard("snapshot", || {
            let manager = self.manager.lock().unwrap();
            let screen_type = manager.get_current_screen_type().clone();
            let view = manager
                .get_screen(&screen_type)
                .map(|screen| screen.view_model())
                .unwrap_or(Value::Null);
            Ok(json!({
                "screen": format!("{:?}", screen_type),
                "stack": manager
                    .get_screen_stack()
                    .iter()
                    .map(|s| format!("{:?}", s))
                    .collect::<Vec<_>>(),
                "exitRequested": manager.is_exit_requested(),
                "palette": palette_json(&self.theme_service.get_colors()),
                "view": view,
            })
            .to_string())
        })
    }
}
