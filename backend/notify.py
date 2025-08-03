import sys, json, urllib.request
from packaging.version import Version, InvalidVersion

CURRENT_VERSION = "1.0.0"


def check_for_updates(url):
    if not url:
        return {"isNewVersion": False}
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
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
    print(json.dumps(check_for_updates(url_arg)))
