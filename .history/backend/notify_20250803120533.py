import sys, json, urllib.request
CURRENT_VERSION = "1.0.0"
def check_for_updates(url):
    try:
        # In a real app, replace local file read with urlopen
        # with urllib.request.urlopen(url) as response:
        #    data = json.loads(response.read().decode())
        with open("../config/update.json", "r") as f:
            data = json.load(f)
        latest = data.get("latestVersion")
        if latest and latest > CURRENT_VERSION:
            return {"isNewVersion": True, "latestVersion": latest, "message": data.get("message"), "downloadUrl": data.get("downloadUrl")}
        return {"isNewVersion": False}
    except Exception: return {"isNewVersion": False}
if __name__ == "__main__": print(json.dumps(check_for_updates(sys.argv[1])))
