def _make_scene(client):
    return client.post("/api/scenes", json={"name": "ObjTest"}).json()["id"]


def test_add_object_logs_event(client):
    sid = _make_scene(client)

    res = client.post(
        f"/api/scenes/{sid}/objects",
        json={"type": "robot"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["type"] == "robot"
    assert body["scene_id"] == sid

    events = client.get(f"/api/scenes/{sid}/events").json()
    actions = [e["action"] for e in events]
    assert "object.added" in actions


def test_metadata_alias_roundtrip(client):
    """API exposes `metadata`; ORM stores it under `meta`. The alias should
    survive a write-then-read cycle and a list fetch."""
    sid = _make_scene(client)

    res = client.post(
        f"/api/scenes/{sid}/objects",
        json={"type": "box", "metadata": {"label": "crate-A", "weight": 42}},
    )
    assert res.status_code == 201
    assert res.json()["metadata"] == {"label": "crate-A", "weight": 42}

    detail = client.get(f"/api/scenes/{sid}").json()
    assert detail["objects"][0]["metadata"] == {"label": "crate-A", "weight": 42}


def test_update_object_transform(client):
    sid = _make_scene(client)
    oid = client.post(
        f"/api/scenes/{sid}/objects", json={"type": "box"}
    ).json()["id"]

    res = client.put(
        f"/api/scenes/{sid}/objects/{oid}",
        json={"position": {"x": 1.5, "y": 0, "z": -2}},
    )
    assert res.status_code == 200
    assert res.json()["position"] == {"x": 1.5, "y": 0, "z": -2}


def test_delete_object(client):
    sid = _make_scene(client)
    oid = client.post(
        f"/api/scenes/{sid}/objects", json={"type": "box"}
    ).json()["id"]

    res = client.delete(f"/api/scenes/{sid}/objects/{oid}")
    assert res.status_code == 204

    detail = client.get(f"/api/scenes/{sid}").json()
    assert detail["objects"] == []


def test_object_404_when_wrong_scene(client):
    """Updating an object via a different scene's URL should 404, not silently
    succeed against the other scene."""
    sid_a = _make_scene(client)
    sid_b = client.post("/api/scenes", json={"name": "OtherScene"}).json()["id"]

    oid = client.post(
        f"/api/scenes/{sid_a}/objects", json={"type": "box"}
    ).json()["id"]

    res = client.put(
        f"/api/scenes/{sid_b}/objects/{oid}",
        json={"position": {"x": 9, "y": 9, "z": 9}},
    )
    assert res.status_code == 404
    assert res.json()["code"] == "OBJECT_NOT_FOUND"


def test_validation_error_envelope(client):
    sid = _make_scene(client)
    res = client.post(f"/api/scenes/{sid}/objects", json={"type": "spaceship"})
    assert res.status_code == 422
    body = res.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert "errors" in body
