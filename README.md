# YouTube Columns Adjuster

A browser extension that allows you to customize the YouTube browsing experience by adjusting the number of video columns displayed on the page.

## Project History

This project is a fork of the original YouTube Columns Adjuster extension created by TuanMinPay. I've enhanced the original extension with additional features and improvements to provide a better user experience.

## Features

### Original Features

- **Custom Column Layout**: Change the number of video columns (1-10) displayed on YouTube
- **Simple Interface**: Easy-to-use popup menu for adjusting settings

### My Enhancements

- **Responsive Design**: Custom columns now only apply above a configurable minimum screen width threshold
- **Hide YouTube Shorts**: Added option to hide Shorts content from your feed
- **Hide End Recommendations**: Added option to hide video recommendations that appear at the end of videos
- **Auto Skip to Start**: Automatically jump to 10% or 20% of the video timeline when it starts (like pressing keyboard keys 1 or 2)
- **Improved Performance**: Added debounce to resize events for better performance
- **Dynamic Content Handling**: Added mutation observer to handle dynamically loaded content
- **Enhanced UI**: Exposed the "Save" button to the main action buttons group when screen width is above the minimum threshold

## Installation

1. Download or clone this repository
2. Open your browser's extension management page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:addons`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Usage

1. Click on the extension icon in your browser toolbar
2. Adjust the number of columns (1-10)
3. Set the minimum screen width at which custom columns will be applied
4. Toggle options to hide Shorts and end recommendations
5. Enable "Auto Skip to Start" and choose 10% or 20% to automatically jump to that point when videos load
6. Click "Save" to apply your settings

## Default Settings

- **Columns**: 5
- **Minimum Screen Width**: 1740px
- **Hide Shorts**: Enabled
- **Hide End Recommendations**: Enabled
- **Auto Skip to Start**: Disabled
- **Skip Percentage**: 10%
- **UI Enhancements**: Applied when screen width is above 1440px

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- **Original Author**: TuanMinPay
- **Fork Maintainer**: lamdan0901
