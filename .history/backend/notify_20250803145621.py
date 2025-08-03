import sys
import json
import urllib.request
import socket
import logging
from packaging.version import Version, InvalidVersion

# This function now includes both the current_version and a timeout parameter
def check_for_updates(url, current_version, timeout=5):
    # We check for both url and current_version, combining the logic
    if not url or not current_version:
        return {"isNewVersion": False}
        
    try:
        # We use the timeout parameter in the request
        with urllib.request.urlopen(url, timeout=timeout) as response:
            data = json.loads(response.read().decode())
    except socket.timeout:
        logging.warning("Timeout checking for updates", exc_info=True)
        return {"isNewVersion": False}
    except Exception:
        # Fail silently for any other network or JSON parsing errors
        return {"isNewVersion": False}

    latest = data.get("latestVersion")
    if not latest:
        return {"isNewVersion": False}

    try:
        # We keep the crucial version comparison logic
        if Version(latest) > Version(current_version):
            return {
                "isNewVersion": True,
                "latestVersion": latest,
                "message": data.get("message"),
                "downloadUrl": data.get("downloadUrl"),
            }
    except InvalidVersion:
        # If the version string is malformed, ignore it
        pass

    return {"isNewVersion": False}


if __name__ == "__main__":
    # The script now expects the URL and the current version as arguments
    url_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    version_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    print(json.dumps(check_for_updates(url_arg, version_arg)))