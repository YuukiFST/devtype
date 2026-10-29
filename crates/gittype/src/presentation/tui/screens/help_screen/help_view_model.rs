use super::{HelpScreen, HelpSection, THIRD_PARTY_LICENSES};
use crate::presentation::ui::view_model::lines_json;
use ratatui::text::Line;
use serde_json::{json, Value};

/// Lines sent from the scroll position down; the Third-Party Licenses tab has
/// thousands of lines and the snapshot is rebuilt every frame.
const HELP_VIEW_MODEL_LINE_WINDOW: usize = 150;

impl HelpScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let colors = self.theme_service.get_colors();
        let current_section = *self.current_section.read().unwrap();
        let sections = HelpSection::all();
        let section_index = sections
            .iter()
            .position(|&s| s == current_section)
            .unwrap_or(0);
        let scroll = *self.scroll_position.read().unwrap() as usize;

        let (total_lines, window) = match current_section {
            HelpSection::ThirdPartyLicenses => {
                let window: Vec<Line> = THIRD_PARTY_LICENSES
                    .lines()
                    .skip(scroll)
                    .take(HELP_VIEW_MODEL_LINE_WINDOW)
                    .map(Line::from)
                    .collect();
                (THIRD_PARTY_LICENSES.lines().count(), window)
            }
            section => {
                let content = match section {
                    HelpSection::Scoring => Self::get_scoring_content(&colors),
                    HelpSection::Ranks => Self::get_ranks_content(&colors),
                    HelpSection::GameHelp => Self::get_game_help_content(&colors),
                    HelpSection::CLI => Self::get_cli_content(&colors),
                    HelpSection::About => Self::get_about_content(&colors),
                    HelpSection::Community => Self::get_community_content(&colors),
                    HelpSection::ThirdPartyLicenses => unreachable!("handled above"),
                };
                let total = content.lines.len();
                let window = content
                    .lines
                    .into_iter()
                    .skip(scroll)
                    .take(HELP_VIEW_MODEL_LINE_WINDOW)
                    .collect();
                (total, window)
            }
        };

        json!({
            "sections": sections.iter().map(|s| s.title()).collect::<Vec<_>>(),
            "sectionIndex": section_index,
            "scrollPosition": scroll,
            "totalLines": total_lines,
            "viewportHeight": *self.viewport_height.read().unwrap(),
            "lines": lines_json(&window),
            "githubFallback": *self.github_fallback.read().unwrap(),
            "starMessage": {
                "url": "https://github.com/YuukiFST/devtype",
                "text": "if you enjoy devtype!",
            },
        })
    }
}
