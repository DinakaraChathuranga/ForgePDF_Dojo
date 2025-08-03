import sys, json, urllib.request, socket, logging
from packaging.version import Version, InvalidVersion

CURRENT_VERSION = "1.0.0"


def check_for_updates(url, timeout=5):
    if not url:
        return {"isNewVersion": False}
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            data = json.loads(response.read().decode())
    except socket.timeout:
        logging.warning("Timeout checking for updates", exc_info=True)
        return {"isNewVersion": False}
    except Exception:
        return {"isNewVersion": False}

    latest = data.get("latestVersion")
    if not latest:
        return {"isNewVersion": False}

    try:
        if Version(latest) > Version(CURRENT_VERSION):
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
    timeout_arg = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    print(json.dumps(check_for_updates(url_arg, timeout=timeout_arg)))
