use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyEventState, KeyModifiers};
use napi_derive::napi;

/// A key press as GPUI reports it: `key` is the GPUI key name
/// (`"a"`, `"enter"`, `"escape"`, `"left"`), `keyChar` the produced text.
#[napi(object)]
pub struct KeyInput {
    pub key: String,
    pub key_char: Option<String>,
    pub shift: bool,
    pub ctrl: bool,
    pub alt: bool,
}

pub fn to_key_event(input: &KeyInput) -> Option<KeyEvent> {
    let mut modifiers = KeyModifiers::NONE;
    if input.shift {
        modifiers |= KeyModifiers::SHIFT;
    }
    if input.ctrl {
        modifiers |= KeyModifiers::CONTROL;
    }
    if input.alt {
        modifiers |= KeyModifiers::ALT;
    }

    let code = match input.key.as_str() {
        "escape" => KeyCode::Esc,
        "enter" => KeyCode::Enter,
        "tab" if input.shift => KeyCode::BackTab,
        "tab" => KeyCode::Tab,
        "backspace" => KeyCode::Backspace,
        "delete" => KeyCode::Delete,
        "left" => KeyCode::Left,
        "right" => KeyCode::Right,
        "up" => KeyCode::Up,
        "down" => KeyCode::Down,
        "home" => KeyCode::Home,
        "end" => KeyCode::End,
        "pageup" => KeyCode::PageUp,
        "pagedown" => KeyCode::PageDown,
        "space" => KeyCode::Char(' '),
        key => {
            let text = match (&input.key_char, input.ctrl) {
                // Ctrl chords carry no text; the key name is the letter.
                (_, true) => key,
                (Some(text), false) => text.as_str(),
                (None, false) => key,
            };
            let mut chars = text.chars();
            let ch = chars.next()?;
            if chars.next().is_some() {
                return None;
            }
            KeyCode::Char(ch)
        }
    };

    Some(KeyEvent {
        code,
        modifiers,
        kind: KeyEventKind::Press,
        state: KeyEventState::NONE,
    })
}
