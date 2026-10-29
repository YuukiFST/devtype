/// Set to `none` to never launch a browser; callers then show the URL instead.
pub const BROWSER_ENV: &str = "DEVTYPE_BROWSER";

#[cfg(not(feature = "test-mocks"))]
mod real_impl {
    /// Opens a URL in the default browser.
    pub fn open_url(url: &str) -> Result<(), Box<dyn std::error::Error>> {
        if std::env::var(super::BROWSER_ENV).is_ok_and(|value| value == "none") {
            return Err(format!("{}=none disables opening a browser", super::BROWSER_ENV).into());
        }
        open::that(url)?;
        Ok(())
    }
}

#[cfg(feature = "test-mocks")]
mod mock_impl {
    /// Mock implementation that doesn't actually open browsers
    pub fn open_url(_url: &str) -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }
}

#[cfg(not(feature = "test-mocks"))]
pub use real_impl::open_url;

#[cfg(feature = "test-mocks")]
pub use mock_impl::open_url;
