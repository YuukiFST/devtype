use std::path::PathBuf;

use crate::Result;

/// Environment variable that relocates every file the app writes
/// (config, database, cache, logs, cloned repos), in any build profile.
pub const HOME_OVERRIDE_ENV: &str = "DEVTYPE_HOME";

/// `$DEVTYPE_HOME` when set, otherwise `~/.devtype`.
pub fn app_home_dir() -> Result<PathBuf> {
    if let Some(dir) = std::env::var_os(HOME_OVERRIDE_ENV) {
        return Ok(PathBuf::from(dir));
    }
    let home_dir = dirs::home_dir().ok_or_else(|| {
        crate::GitTypeError::ExtractionFailed("Could not determine home directory".to_string())
    })?;
    Ok(home_dir.join(".devtype"))
}

pub trait AppDataProvider {
    fn get_app_data_dir() -> Result<PathBuf> {
        #[cfg(not(feature = "test-mocks"))]
        {
            use crate::GitTypeError;

            let data_dir = if std::env::var_os(HOME_OVERRIDE_ENV).is_some() {
                app_home_dir()?
            } else if cfg!(debug_assertions) {
                std::env::current_dir()
                    .map_err(|e| {
                        GitTypeError::ExtractionFailed(format!(
                            "Could not get current directory: {}",
                            e
                        ))
                    })?
                    .join(".config")
            } else {
                app_home_dir()?
            };

            std::fs::create_dir_all(&data_dir)?;
            Ok(data_dir)
        }

        #[cfg(feature = "test-mocks")]
        {
            Ok(PathBuf::from("/tmp/test"))
        }
    }
}
