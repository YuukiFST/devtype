//! What the host needs before any engine runs: the theme for its own
//! screens and the release check `run_game_session` does first.

use std::sync::Arc;

use gittype::domain::services::version_service::VersionServiceInterface;
use gittype::presentation::di::AppModule;
use gittype::presentation::ui::view_model::palette_json;
use napi::bindgen_prelude::*;
use napi::Env;
use napi_derive::napi;
use shaku::HasComponent;

use crate::game::{init_logging, init_services};

/// JSON palette of the configured theme, for screens no engine renders.
#[napi]
pub fn load_palette() -> String {
    init_logging();
    let container = AppModule::builder().build();
    palette_json(&init_services(&container).get_colors()).to_string()
}

#[napi(object)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
}

pub struct CheckForUpdate;

impl Task for CheckForUpdate {
    type Output = Option<UpdateInfo>;
    type JsValue = Option<UpdateInfo>;

    /// A failed request or a repository without releases counts as no
    /// update, as in `run_game_session`.
    fn compute(&mut self) -> Result<Self::Output> {
        let Ok(runtime) = tokio::runtime::Runtime::new() else {
            return Ok(None);
        };
        let container = AppModule::builder().build();
        let version_service: Arc<dyn VersionServiceInterface> = container.resolve();
        let result =
            runtime.block_on(version_service.check_with_version(env!("CARGO_PKG_VERSION")));
        Ok(match result {
            Ok((true, current_version, latest_version)) => Some(UpdateInfo {
                current_version,
                latest_version,
            }),
            Ok(_) => None,
            Err(e) => {
                log::debug!("Version check skipped: {}", e);
                None
            }
        })
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(output)
    }
}

/// The latest devtype release when it is newer than this build, using
/// gittype's 24-hour cache of the GitHub answer.
#[napi(ts_return_type = "Promise<UpdateInfo | null>")]
pub fn check_for_update() -> AsyncTask<CheckForUpdate> {
    AsyncTask::new(CheckForUpdate)
}
