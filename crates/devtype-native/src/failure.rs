//! The last fatal error or panic, kept for the host's error and panic
//! screens. A panic on any thread lands here through the panic hook, so a
//! crash in a background loading step is reported like one in a call.

use std::sync::{Arc, Mutex, Once};

use gittype::domain::events::{EventBus, EventBusInterface};
use gittype::domain::services::theme_service::ThemeServiceInterface;
use gittype::infrastructure::logging;
use gittype::presentation::cli::commands::game::game_error_lines;
use gittype::presentation::di::AppModule;
use gittype::presentation::tui::screens::PanicScreen;
use gittype::presentation::tui::Screen;
use gittype::GitTypeError;
use napi_derive::napi;
use serde_json::json;
use shaku::HasComponent;

enum Failure {
    Error(Vec<String>),
    Panic(String),
}

static LAST_FAILURE: Mutex<Option<Failure>> = Mutex::new(None);
static PANIC_HOOK: Once = Once::new();

fn store(failure: Failure) {
    let mut last = LAST_FAILURE.lock().unwrap_or_else(|e| e.into_inner());
    // The first failure is the cause; later ones are its fallout.
    if last.is_none() {
        *last = Some(failure);
    }
}

pub fn record_error(e: &GitTypeError) {
    store(Failure::Error(game_error_lines(e)));
}

/// Same message, location and logging as gittype's `setup_signal_handlers`.
pub fn install_panic_hook() {
    PANIC_HOOK.call_once(|| {
        std::panic::set_hook(Box::new(|panic_info| {
            let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic occurred".to_string()
            };
            let full_message = match panic_info.location() {
                Some(location) => format!(
                    "{}\n\nLocation: {}:{}:{}",
                    message,
                    location.file(),
                    location.line(),
                    location.column()
                ),
                None => message,
            };
            logging::log_panic_to_file(panic_info);
            logging::log_error_to_file(&GitTypeError::PanicError(full_message.clone()));
            store(Failure::Panic(full_message));
        }));
    });
}

fn panic_view(message: String) -> serde_json::Value {
    let container = AppModule::builder().build();
    let theme_service: Arc<dyn ThemeServiceInterface> = container.resolve();
    let event_bus: Arc<dyn EventBusInterface> = Arc::new(EventBus::default());
    PanicScreen::with_error_message(message, event_bus, theme_service, None).view_model()
}

/// JSON `{kind: "error", lines}` or `{kind: "panic", view}` for the first
/// failure since the last call, or `null`.
#[napi]
pub fn take_failure() -> Option<String> {
    let failure = LAST_FAILURE
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .take()?;
    let value = match failure {
        Failure::Error(lines) => json!({ "kind": "error", "lines": lines }),
        Failure::Panic(message) => json!({ "kind": "panic", "view": panic_view(message) }),
    };
    Some(value.to_string())
}
