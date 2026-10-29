//! gittype's command line, parsed with its own clap definition. Console
//! commands run here to completion; GUI commands come back as an outcome
//! the host turns into a window.

use clap::{CommandFactory, FromArgMatches};
use gittype::infrastructure::console::ConsoleImpl;
use gittype::infrastructure::logging;
use gittype::presentation::cli::args::RepoCommands;
use gittype::presentation::cli::commands::game::extraction_options_for_langs;
use gittype::presentation::cli::commands::trending::validate_trending_language;
use gittype::presentation::cli::{run_cli as run_console_command, Cli, Commands};
use napi_derive::napi;

use crate::game::init_logging;

const VERSION: &str = env!("CARGO_PKG_VERSION");

#[napi(object)]
pub struct CliOutcome {
    /// `exit`, `game`, `repoList`, `repoPlay` or `trending`.
    pub kind: String,
    /// Process status for `exit`.
    pub exit_code: i32,
    pub repo_path: Option<String>,
    pub repo: Option<String>,
    pub langs: Option<Vec<String>>,
    /// `trending` only.
    pub language: Option<String>,
    /// `trending` only.
    pub period: Option<String>,
}

impl CliOutcome {
    fn exit(exit_code: i32) -> Self {
        Self::of_kind("exit", exit_code)
    }

    fn of_kind(kind: &str, exit_code: i32) -> Self {
        Self {
            kind: kind.to_string(),
            exit_code,
            repo_path: None,
            repo: None,
            langs: None,
            language: None,
            period: None,
        }
    }

    fn game(repo_path: Option<String>, repo: Option<String>, langs: Option<Vec<String>>) -> Self {
        Self {
            repo_path,
            repo,
            langs,
            ..Self::of_kind("game", 0)
        }
    }
}

/// What gittype's `main` does with an error `run_cli` returns.
fn report_cli_error(e: gittype::GitTypeError) -> CliOutcome {
    logging::log_error_to_file(&e);
    eprintln!("Error: {:?}", anyhow::Error::from(e));
    CliOutcome::exit(1)
}

/// Parses `argv` (user arguments, without the program name). `--help`,
/// `--version` and usage errors print clap's output and exit.
#[napi]
pub fn run_cli(argv: Vec<String>) -> CliOutcome {
    let command = Cli::command().version(VERSION);
    let matches =
        match command.try_get_matches_from(std::iter::once("devtype".to_string()).chain(argv)) {
            Ok(matches) => matches,
            Err(e) => {
                let _ = e.print();
                return CliOutcome::exit(e.exit_code());
            }
        };
    let cli = match Cli::from_arg_matches(&matches) {
        Ok(cli) => cli,
        Err(e) => {
            let _ = e.print();
            return CliOutcome::exit(e.exit_code());
        }
    };

    match &cli.command {
        None => {
            init_logging();
            let console = ConsoleImpl::new();
            if let Err(e) = extraction_options_for_langs(&console, cli.langs.clone()) {
                return report_cli_error(e);
            }
            CliOutcome::game(
                cli.repo_path
                    .as_ref()
                    .map(|path| path.to_string_lossy().to_string()),
                cli.repo.clone(),
                cli.langs.clone(),
            )
        }
        Some(Commands::Repo {
            repo_command: RepoCommands::List,
        }) => {
            init_logging();
            CliOutcome::of_kind("repoList", 0)
        }
        Some(Commands::Repo {
            repo_command: RepoCommands::Play,
        }) => {
            init_logging();
            CliOutcome::of_kind("repoPlay", 0)
        }
        Some(Commands::Trending {
            language,
            repo_name,
            period,
        }) => {
            init_logging();
            trending_outcome(language.clone(), repo_name.clone(), period.clone())
        }
        Some(_) => match run_console_command(cli) {
            Ok(()) => CliOutcome::exit(0),
            Err(e) => report_cli_error(e),
        },
    }
}

/// `run_trending`'s checks; a full `owner/repo` name plays it directly.
fn trending_outcome(
    language: Option<String>,
    repo_name: Option<String>,
    period: String,
) -> CliOutcome {
    let console = ConsoleImpl::new();
    if let Some(lang) = &language {
        if let Err(e) = validate_trending_language(&console, lang) {
            return report_cli_error(e);
        }
    }

    match repo_name {
        Some(name) if name.contains('/') => {
            CliOutcome::game(None, Some(format!("https://github.com/{}", name)), None)
        }
        Some(_) => {
            eprintln!("⚠️ Repository name must be in format 'owner/repo'");
            CliOutcome::exit(0)
        }
        None => CliOutcome {
            language,
            period: Some(period),
            ..CliOutcome::of_kind("trending", 0)
        },
    }
}
