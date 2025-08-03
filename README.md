# ForgePDF Dojo

A portable desktop PDF utility built with Electron and Python.

## Update Configuration

The application checks for updates by downloading a small `update.json` file.
Set the location of this file in `config/settings.json` using the `updateUrl` field.

Maintainers should host `update.json` at a publicly accessible HTTPS endpoint
(such as a web server or GitHub Pages) and point `updateUrl` to that address.
The `config/update.json` file in this repository serves as an example of the
expected format.

