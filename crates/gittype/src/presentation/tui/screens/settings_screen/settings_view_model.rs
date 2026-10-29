use super::{SettingsScreen, SettingsSection};
use crate::domain::models::color_mode::ColorMode;
use crate::presentation::ui::view_model::color_json;
use serde_json::{json, Value};

impl SettingsScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let current_section = *self.current_section.read().unwrap();
        let sections: Vec<&str> = SettingsSection::all()
            .iter()
            .map(|section| section.title())
            .collect();
        let section_index = SettingsSection::all()
            .iter()
            .position(|&s| s == current_section)
            .unwrap_or(0);

        let color_modes: Vec<&str> = self
            .color_modes
            .read()
            .unwrap()
            .iter()
            .map(|mode| match mode {
                ColorMode::Dark => "Dark",
                ColorMode::Light => "Light",
            })
            .collect();
        let themes: Vec<Value> = self
            .themes
            .read()
            .unwrap()
            .iter()
            .map(|theme| json!({ "id": theme.id, "name": theme.name }))
            .collect();

        // Same roles and order as SettingsScreen::render_description.
        let colors = self.theme_service.get_colors();
        let selected_theme = self.get_selected_theme();
        let preview: Vec<Value> =
            if current_section == SettingsSection::Theme && selected_theme.is_some() {
                [
                    ("Border", colors.border()),
                    ("Title", colors.title()),
                    ("Text", colors.text()),
                    ("Text Secondary", colors.text_secondary()),
                    ("Success", colors.success()),
                    ("Error", colors.error()),
                    ("Warning", colors.warning()),
                    ("Info", colors.info()),
                    ("Key Action", colors.key_action()),
                    ("Key Navigation", colors.key_navigation()),
                    ("Key Back", colors.key_back()),
                    ("Typed Text", colors.typed_text()),
                    ("Cursor", colors.current_cursor()),
                    ("Mistake", colors.mistake_bg()),
                    ("Untyped Text", colors.untyped_text()),
                ]
                .into_iter()
                .map(|(name, color)| {
                    json!({
                        "name": name,
                        "label": format!("This is {} color", name),
                        "color": color_json(color),
                    })
                })
                .collect()
            } else {
                Vec::new()
            };

        json!({
            "sections": sections,
            "sectionIndex": section_index,
            "sectionDescription": current_section.description(),
            "colorModes": color_modes,
            "selectedColorMode": self.color_mode_state.read().unwrap().selected(),
            "themes": themes,
            "selectedTheme": self.theme_state.read().unwrap().selected(),
            "themeDescription": selected_theme.map(|t| t.description),
            "colorPreview": preview,
            "isPreviewMode": *self.is_preview_mode.read().unwrap(),
        })
    }
}
