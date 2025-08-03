import sys
import json
import urllib.request
import socket
import logging
import os
from packaging.version import Version, InvalidVersion

def _load_current_version():
    env_version = os.getenv("APP_VERSION")
    if env_version:
        return env_version

    config_path = os.path.join(os.path.dirname(__file__), "..", "package.json")
    try:
        with open(config_path) as f:
            return json.load(f).get("version", "0.0.0")
    except Exception:
        logging.exception("Failed to read app version")
        return "0.0.0"

CURRENT_VERSION = _load_current_version()

def check_for_updates(url, current_version, timeout=5):
    if not url or not current_version:
        return {"isNewVersion": False}
        
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            data = json.loads(response.read().decode())
    except socket.timeout:
        logging.warning("Timeout checking for updates", exc_info=True)
        return {"isNewVersion": False}
    except Exception:
        logging.exception("Unexpected error checking for updates")
        return {"isNewVersion": False}

    latest = data.get("latestVersion")
    if not latest:
        return {"isNewVersion": False}

    try:
        if Version(latest) > Version(current_version):
            return {
                "isNewVersion": True,
                "latestVersion": latest,
                "message": data.get("message"),
                "downloadUrl": data.get("downloadUrl"),
            }
    except InvalidVersion:
        pass

    return {"isNewVersion": False}

if __name__ == "__main__":
    url_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    version_arg = sys.argv[2] if len(sys.argv) > 2 else CURRENT_VERSION
    print(json.dumps(check_for_updates(url_arg, version_arg)))