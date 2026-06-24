def test_list_empty(client):
    res = client.get("/api/scenes")
    assert res.status_code == 200
    assert res.json() == []


def test_create_scene_logs_event(client):
    res = client.post("/api/scenes", json={"name": "Lab"})
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Lab"
    assert body["objects"] == []

    events = client.get(f"/api/scenes/{body['id']}/events").json()
    actions = [e["action"] for e in events]
    assert "scene.created" in actions


def test_get_404_returns_envelope(client):
    res = client.get("/api/scenes/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
    assert res.json() == {"detail": "Scene not found", "code": "SCENE_NOT_FOUND"}


def test_update_scene_name(client):
    sid = client.post("/api/scenes", json={"name": "Original"}).json()["id"]

    res = client.put(f"/api/scenes/{sid}", json={"name": "Renamed"})
    assert res.status_code == 200
    assert res.json()["name"] == "Renamed"

    events = client.get(f"/api/scenes/{sid}/events").json()
    assert any(e["action"] == "scene.updated" for e in events)


def test_update_thumbnail_does_not_log_event(client):
    """Thumbnail updates are silent — they'd flood the event log otherwise."""
    sid = client.post("/api/scenes", json={"name": "Thumb"}).json()["id"]
    before = client.get(f"/api/scenes/{sid}/events").json()

    res = client.put(
        f"/api/scenes/{sid}",
        json={"thumbnail": "data:image/jpeg;base64,xxxx"},
    )
    assert res.status_code == 200
    assert res.json()["thumbnail"] == "data:image/jpeg;base64,xxxx"

    after = client.get(f"/api/scenes/{sid}/events").json()
    assert len(after) == len(before)


def test_delete_scene_cascades(client):
    sid = client.post("/api/scenes", json={"name": "ToDelete"}).json()["id"]
    client.post(f"/api/scenes/{sid}/objects", json={"type": "box"})

    res = client.delete(f"/api/scenes/{sid}")
    assert res.status_code == 204

    assert client.get(f"/api/scenes/{sid}").status_code == 404
