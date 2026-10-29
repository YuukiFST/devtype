use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use crate::domain::models::{ExtractionOptions, Languages};
use crate::domain::services::theme_service::ThemeServiceInterface;
use crate::domain::stores::RepositoryStoreInterface;
use crate::infrastructure::console::{Console, ConsoleImpl};
use crate::infrastructure::logging;
use crate::presentation::cli::args::Cli;
use crate::presentation::di::AppModule;
use crate::presentation::signal_handler::setup_signal_handlers;
use crate::presentation::tui::screens::{VersionCheckResult, VersionCheckScreen};
use crate::presentation::tui::{ScreenManagerFactory, ScreenManagerImpl, ScreenType};
use crate::{GitTypeError, Result};

pub fn run_game_session(cli: Cli) -> Result<()> {
    log::info!("Starting GitType game session");

    let console = ConsoleImpl::new();

    // Create DI container
    let container = AppModule::builder().build();

    // Get SessionManager from DI container and setup event subscriptions
    use crate::domain::services::session_manager_service::{
        SessionManager, SessionManagerInterface,
    };
    use shaku::HasComponent;
    let session_manager_trait: Arc<dyn SessionManagerInterface> = container.resolve();

    // Downcast to concrete SessionManager type for event subscription setup
    if let Some(_session_manager) = session_manager_trait
        .as_any()
        .downcast_ref::<SessionManager>()
    {
        // Get a new Arc pointing to the same SessionManager
        // This is safe because we know the type matches
        let session_manager_arc = unsafe {
            Arc::from_raw(Arc::into_raw(session_manager_trait.clone()) as *const SessionManager)
        };
        SessionManager::setup_event_subscriptions(session_manager_arc);
    }

    // Get ScreenManagerFactory from DI container
    let factory: &dyn ScreenManagerFactory = container.resolve_ref();

    // Check for updates before starting the game session
    let should_exit = {
        let rt = tokio::runtime::Runtime::new().map_err(|e| {
            GitTypeError::TerminalError(format!("Failed to create tokio runtime: {}", e))
        })?;
        rt.block_on(async {
            use crate::domain::services::version_service::VersionServiceInterface;
            use shaku::HasComponent;
            let version_service: std::sync::Arc<dyn VersionServiceInterface> = container.resolve();
            if let Ok((has_update, current_version, latest_version)) = version_service.check().await
            {
                if has_update {
                    match VersionCheckScreen::show_legacy(&current_version, &latest_version)? {
                        VersionCheckResult::Continue => return Ok::<bool, GitTypeError>(false),
                        VersionCheckResult::Exit => return Ok::<bool, GitTypeError>(true),
                    }
                }
            }
            Ok(false)
        })
    }?;

    if should_exit {
        log::info!("User exited after update notification");
        return Ok(());
    }

    // Initialize config service (must be done before theme service)
    {
        use crate::domain::services::config_service::ConfigServiceInterface;
        let config_service: &dyn ConfigServiceInterface = container.resolve_ref();
        if let Err(e) = config_service.init() {
            log::warn!("Failed to initialize config service: {}", e);
            console.eprintln(&format!("⚠️ Warning: Failed to load configuration: {}", e))?;
            console.eprintln("   Using default configuration.")?;
        }
    }

    // Initialize theme service
    {
        let theme_service: &dyn ThemeServiceInterface = container.resolve_ref();
        if let Err(e) = theme_service.init() {
            log::warn!("Failed to initialize theme service: {}", e);
            console.eprintln(&format!(
                "⚠️ Warning: Failed to load theme configuration: {}",
                e
            ))?;
            console.eprintln("   Using default theme.")?;
        }
    }

    // Session repository will be initialized in DatabaseInitStep during loading screen

    let options = extraction_options_for_langs(&console, cli.langs)?;

    let repo_spec = cli.repo.as_deref();
    let default_repo_path = cli.repo_path.unwrap_or_else(|| PathBuf::from("."));
    let initial_repo_path = if repo_spec.is_some() {
        None
    } else {
        Some(&default_repo_path)
    };

    // Store processing parameters in RepositoryStore
    let repository_store: &dyn RepositoryStoreInterface = container.resolve_ref();
    if let Some(spec) = repo_spec {
        repository_store.set_repo_spec(spec.to_string());
    }
    if let Some(path) = initial_repo_path {
        repository_store.set_repo_path(path.clone());
    }
    repository_store.set_extraction_options(options.clone());

    log::info!(
        "Initializing all screens with processing parameters: repo_spec={:?}, repo_path={:?}",
        repo_spec,
        initial_repo_path
    );

    // Create ScreenManager using DI container factory
    let screen_manager_impl = factory.create(&container);
    let screen_manager = Arc::new(Mutex::new(screen_manager_impl));

    // Set up signal handlers with ScreenManager reference
    setup_signal_handlers(screen_manager.clone());

    {
        let mut manager = screen_manager.lock().unwrap();
        manager.initialize_terminal()?;
        manager.set_current_screen(ScreenType::Loading)?;
    }

    // Set up event subscriptions after initialization
    ScreenManagerImpl::setup_event_subscriptions(&screen_manager);

    // Run ScreenManager - LoadingScreen will handle processing internally
    // StageRepository and SessionManager will be initialized automatically when data is ready
    let session_result = screen_manager.lock().unwrap().run();

    match session_result {
        Ok(_) => {
            log::info!("Game session completed successfully");
        }
        Err(e) => {
            log::error!("Game session failed with error: {}", e);
            handle_game_error(&console, e)?;
        }
    }

    Ok(())
}

fn handle_game_error(console: &impl Console, e: GitTypeError) -> Result<()> {
    // Log the error details for debugging before handling user-friendly output
    logging::log_error_to_file(&e);

    for line in game_error_lines(&e) {
        console.eprintln(&line)?;
    }
    std::process::exit(1);
}

/// The message and tips `handle_game_error` prints for `e`, one entry per line.
pub fn game_error_lines(e: &GitTypeError) -> Vec<String> {
    match e {
        GitTypeError::NoSupportedFiles => vec![
            "❌ No code chunks found in the repository".into(),
            "💡 Try:".into(),
            "   • Using a different repository path".into(),
            "   • Adjusting --langs filter (e.g., --langs rust,python)".into(),
        ],
        GitTypeError::RepositoryNotFound(path) => vec![
            format!("❌ Repository not found at path: {}", path.display()),
            "💡 Ensure the path exists and is a valid repository".into(),
        ],
        GitTypeError::RepositoryCloneError(git_error) => vec![
            format!("❌ Failed to clone repository: {}", git_error),
            "💡 Check:".into(),
            "   • Repository URL is correct".into(),
            "   • You have access to the repository".into(),
            "   • Internet connection is available".into(),
        ],
        GitTypeError::ExtractionFailed(msg) => vec![
            format!("❌ Code extraction failed: {}", msg),
            "💡 Try using different --langs filter".into(),
        ],
        GitTypeError::InvalidRepositoryFormat(msg) => vec![
            format!("❌ Invalid repository format: {}", msg),
            "💡 Supported formats:".into(),
            "   • owner/repo".into(),
            "   • https://github.com/owner/repo".into(),
            "   • git@github.com:owner/repo.git".into(),
        ],
        GitTypeError::IoError(io_error) => vec![format!("❌ IO error: {}", io_error)],
        GitTypeError::DatabaseError(db_error) => vec![format!("❌ Database error: {}", db_error)],
        GitTypeError::GlobPatternError(glob_error) => vec![
            format!("❌ Invalid glob pattern: {}", glob_error),
            "💡 Check your glob patterns in ExtractionOptions".into(),
        ],
        GitTypeError::SerializationError(json_error) => {
            vec![format!("❌ Serialization error: {}", json_error)]
        }
        GitTypeError::TerminalError(msg) => {
            let mut lines = vec![format!("❌ Terminal error: {}", msg)];
            if msg.contains("No such device or address") {
                lines.push("💡 This error often occurs in WSL or SSH environments where terminal features are limited.".into());
                lines.push(
                    "   Try running GitType in a native terminal or GUI terminal emulator.".into(),
                );
            }
            lines
        }
        GitTypeError::WalkDirError(walk_error) => vec![
            format!("❌ Directory walk error: {}", walk_error),
            "💡 Check directory permissions and try again".into(),
        ],
        GitTypeError::TreeSitterLanguageError(lang_error) => vec![
            format!("❌ Language parsing error: {}", lang_error),
            "💡 This might be caused by unsupported language features".into(),
        ],
        GitTypeError::PanicError(msg) => vec![
            format!("💥 Application panic occurred: {}", msg),
            "💡 This indicates an unexpected error. Please report this issue.".into(),
        ],
        GitTypeError::HttpError(http_error) => vec![
            format!("❌ HTTP request failed: {}", http_error),
            "💡 Check your internet connection and try again".into(),
        ],
        GitTypeError::ApiError(msg) => vec![
            format!("❌ API error: {}", msg),
            "💡 The service may be temporarily unavailable".into(),
        ],
        GitTypeError::ValidationError(msg) => vec![format!("❌ {}", msg)],
        GitTypeError::ScreenInitializationError(msg) => vec![
            format!("❌ Screen initialization error: {}", msg),
            "💡 This is an internal error. Please report this issue.".into(),
        ],
    }
}

/// Validates `--langs` like the game session: unsupported names print the
/// supported list and exit with status 1.
pub fn extraction_options_for_langs(
    console: &impl Console,
    langs: Option<Vec<String>>,
) -> Result<ExtractionOptions> {
    let mut options = ExtractionOptions::default();

    if let Some(langs) = langs {
        if let Err(unsupported_langs) = Languages::validate_languages(&langs) {
            console.eprintln(&format!(
                "❌ Unsupported language(s): {}",
                unsupported_langs.join(", ")
            ))?;
            console.eprintln("💡 Supported languages:")?;
            let supported = Languages::get_supported_languages();
            let mut supported_display = supported.clone();
            supported_display.dedup();
            for chunk in supported_display.chunks(6) {
                console.eprintln(&format!("   {}", chunk.join(", ")))?;
            }
            std::process::exit(1);
        }

        options.languages = Some(langs);
        options.apply_language_filter();
    }

    Ok(options)
}
