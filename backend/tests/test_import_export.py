def test_export_then_import_roundtrip(client):
    sid = client.post("/api/scenes", json={"name": "Source"}).json()["id"]
    client.post(
        f"/api/scenes/{sid}/objects",
        json={
            "type": "robot",
            "position": {"x": 1, "y": 2, "z": 3},
            "metadata": {"name": "Wall-E"},
        },
    )
    client.post(f"/api/scenes/{sid}/objects", json={"type": "box"})

    export = client.get(f"/api/scenes/{sid}/export").json()
    assert export["schema_version"] == 1
    assert export["name"] == "Source"
    assert len(export["objects"]) == 2
    assert export["objects"][0]["metadata"] == {"name": "Wall-E"}

    # Re-import as a new scene
    export["name"] = "Imported copy"
    new_scene = client.post("/api/scenes/import", json=export).json()
    assert new_scene["name"] == "Imported copy"
    assert len(new_scene["objects"]) == 2
    # IDs are server-generated so they differ from the source
    assert new_scene["id"] != sid


def test_export_missing_scene_returns_envelope(client):
    res = client.get("/api/scenes/00000000-0000-0000-0000-000000000000/export")
    assert res.status_code == 404
    assert res.json()["code"] == "SCENE_NOT_FOUND"
