use anyhow::Result;

use crate::domain::models::{GitRepository, SessionResult};
use crate::domain::services::scoring::Rank;
use crate::infrastructure::browser;

#[derive(Debug, Clone)]
pub enum SharingPlatform {
    X,
    Reddit,
    LinkedIn,
    Facebook,
}

impl SharingPlatform {
    pub fn name(&self) -> &'static str {
        match self {
            Self::X => "X",
            Self::Reddit => "Reddit",
            Self::LinkedIn => "LinkedIn",
            Self::Facebook => "Facebook",
        }
    }

    pub fn all() -> Vec<Self> {
        vec![Self::X, Self::Reddit, Self::LinkedIn, Self::Facebook]
    }
}

/// Whether the share URL reached a browser or must be shown to the user.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShareOutcome {
    Opened,
    Fallback(String),
}

pub struct SharingService;

impl SharingService {
    pub fn share_result(
        metrics: &SessionResult,
        platform: SharingPlatform,
        repo_info: &Option<GitRepository>,
    ) -> ShareOutcome {
        let url = Self::generate_share_url(metrics, &platform, repo_info);
        Self::open_or_fallback(url)
    }

    /// Opens `url` in the browser, or hands it back for the screen to show.
    pub fn open_or_fallback(url: String) -> ShareOutcome {
        match Self::open_browser(&url) {
            Ok(()) => ShareOutcome::Opened,
            Err(_) => ShareOutcome::Fallback(url),
        }
    }

    pub fn generate_share_url(
        metrics: &SessionResult,
        platform: &SharingPlatform,
        repo_info: &Option<GitRepository>,
    ) -> String {
        let text = Self::create_share_text(metrics, repo_info);

        match platform {
            SharingPlatform::X => {
                format!(
                    "https://x.com/intent/tweet?text={}",
                    urlencoding::encode(&text)
                )
            }
            SharingPlatform::Reddit => {
                let best_rank = Rank::for_score(metrics.session_score);
                let title = format!(
                    "Achieved {} rank with {:.0} points in gittype!",
                    best_rank.name(),
                    metrics.session_score
                );
                format!(
                    "https://www.reddit.com/submit?title={}&selftext=true&text={}",
                    urlencoding::encode(&title),
                    urlencoding::encode(&text)
                )
            }
            SharingPlatform::LinkedIn => {
                format!(
                    "https://www.linkedin.com/feed/?shareActive=true&mini=true&text={}",
                    urlencoding::encode(&text)
                )
            }
            SharingPlatform::Facebook => {
                // Facebook's quote parameter may not work reliably, but it's still the best option
                format!(
                    "https://www.facebook.com/sharer/sharer.php?u={}&quote={}",
                    urlencoding::encode("https://github.com/unhappychoice/gittype"),
                    urlencoding::encode(&text)
                )
            }
        }
    }

    pub fn create_share_text(metrics: &SessionResult, repo_info: &Option<GitRepository>) -> String {
        let best_rank = Rank::for_score(metrics.session_score);
        if let Some(repo) = repo_info {
            format!(
                "Achieved \"{}\" with {:.0}pts on [{}/{}] in gittype! CPM: {:.0}, Mistakes: {} 🚀\n\nType your own code! https://github.com/unhappychoice/gittype\n\n#gittype #typing #coding",
                best_rank.name(),
                metrics.session_score,
                repo.user_name,
                repo.repository_name,
                metrics.overall_cpm,
                metrics.valid_mistakes + metrics.invalid_mistakes
            )
        } else {
            format!(
                "Achieved \"{}\" with {:.0}pts in gittype! CPM: {:.0}, Mistakes: {} 🚀\n\nType your own code! https://github.com/unhappychoice/gittype\n\n#gittype #typing #coding",
                best_rank.name(),
                metrics.session_score,
                metrics.overall_cpm,
                metrics.valid_mistakes + metrics.invalid_mistakes
            )
        }
    }

    fn open_browser(url: &str) -> Result<()> {
        browser::open_url(url).map_err(|e| anyhow::anyhow!("Failed to open browser: {}", e))
    }
}
