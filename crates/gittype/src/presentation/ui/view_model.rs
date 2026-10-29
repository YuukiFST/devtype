//! Conversions from ratatui styling to JSON, used by `Screen::view_model`.

use crate::presentation::ui::{ansi256_to_rgb, Colors};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use serde_json::{json, Value};

/// `#rrggbb` for a concrete color, `None` for `Reset` (the host's default).
pub fn color_hex(color: Color) -> Option<String> {
    let (r, g, b) = match color {
        Color::Reset => return None,
        Color::Black => (0, 0, 0),
        Color::Red => (205, 49, 49),
        Color::Green => (13, 188, 121),
        Color::Yellow => (229, 229, 16),
        Color::Blue => (36, 114, 200),
        Color::Magenta => (188, 63, 188),
        Color::Cyan => (17, 168, 205),
        Color::Gray => (204, 204, 204),
        Color::DarkGray => (118, 118, 118),
        Color::LightRed => (241, 76, 76),
        Color::LightGreen => (35, 209, 139),
        Color::LightYellow => (245, 245, 67),
        Color::LightBlue => (59, 142, 234),
        Color::LightMagenta => (214, 112, 214),
        Color::LightCyan => (41, 184, 219),
        Color::White => (242, 242, 242),
        Color::Rgb(r, g, b) => (r, g, b),
        Color::Indexed(i) => {
            let rgb = ansi256_to_rgb(i);
            (rgb.r, rgb.g, rgb.b)
        }
    };
    Some(format!("#{:02x}{:02x}{:02x}", r, g, b))
}

pub fn color_json(color: Color) -> Value {
    color_hex(color).map(Value::String).unwrap_or(Value::Null)
}

fn style_json(style: &Style, base: &Style) -> (Value, Value, bool) {
    let merged = base.patch(*style);
    let fg = merged.fg.map(color_json).unwrap_or(Value::Null);
    let bg = merged.bg.map(color_json).unwrap_or(Value::Null);
    let bold = merged.add_modifier.contains(Modifier::BOLD);
    (fg, bg, bold)
}

pub fn span_json(span: &Span, line_style: &Style) -> Value {
    let (fg, bg, bold) = style_json(&span.style, line_style);
    json!({ "text": span.content, "fg": fg, "bg": bg, "bold": bold })
}

/// A styled line as an array of `{text, fg, bg, bold}` runs.
pub fn line_json(line: &Line) -> Value {
    Value::Array(
        line.spans
            .iter()
            .map(|span| span_json(span, &line.style))
            .collect(),
    )
}

pub fn lines_json(lines: &[Line]) -> Value {
    Value::Array(lines.iter().map(line_json).collect())
}

/// Every color role a screen can use, resolved for the current theme.
pub fn palette_json(colors: &Colors) -> Value {
    json!({
        "border": color_json(colors.border()),
        "title": color_json(colors.title()),
        "text": color_json(colors.text()),
        "textSecondary": color_json(colors.text_secondary()),
        "background": color_json(colors.background()),
        "backgroundSecondary": color_json(colors.background_secondary()),
        "success": color_json(colors.success()),
        "info": color_json(colors.info()),
        "error": color_json(colors.error()),
        "warning": color_json(colors.warning()),
        "keyAction": color_json(colors.key_action()),
        "keyNavigation": color_json(colors.key_navigation()),
        "keyBack": color_json(colors.key_back()),
        "score": color_json(colors.score()),
        "cpmWpm": color_json(colors.cpm_wpm()),
        "accuracy": color_json(colors.accuracy()),
        "duration": color_json(colors.duration()),
        "stageInfo": color_json(colors.stage_info()),
        "typedText": color_json(colors.typed_text()),
        "currentCursor": color_json(colors.current_cursor()),
        "cursorBg": color_json(colors.cursor_bg()),
        "mistakeBg": color_json(colors.mistake_bg()),
        "untypedText": color_json(colors.untyped_text()),
        "countdown3": color_json(colors.countdown_3()),
        "countdown2": color_json(colors.countdown_2()),
        "countdown1": color_json(colors.countdown_1()),
        "countdownGo": color_json(colors.countdown_go()),
        "tierBeginner": color_json(Colors::tier_beginner()),
        "tierIntermediate": color_json(Colors::tier_intermediate()),
        "tierAdvanced": color_json(Colors::tier_advanced()),
        "tierExpert": color_json(Colors::tier_expert()),
        "tierLegendary": color_json(Colors::tier_legendary()),
    })
}

pub fn git_repository_json(repo: Option<&crate::domain::models::GitRepository>) -> Value {
    match repo {
        Some(repo) => json!({
            "user": repo.user_name,
            "name": repo.repository_name,
            "remoteUrl": repo.remote_url,
            "branch": repo.branch,
            "commit": repo.commit_hash.as_ref().map(|hash| hash.chars().take(8).collect::<String>()),
            "dirty": repo.is_dirty,
        }),
        None => Value::Null,
    }
}
