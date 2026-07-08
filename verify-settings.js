async function testSettingsApi() {
  // Step 1: Fetch current restaurant ID (assuming we can query one or use a known one)
  const fetchRes = await fetch('http://localhost:5000/api/restaurants/kanpur/vis');
  const fetchJson = await fetchRes.json();
  const restaurantId = fetchJson.data._id;
  
  console.log("Restaurant ID:", restaurantId);
  console.log("Initial settings:", fetchJson.data.menuUiSettings);

  // Step 2: Patch settings
  const testSettings = {
    colorPalette: "ocean",
    font: "outfit",
    layout: "simple-list",
    showBanner: false,
    showDescription: false,
    showBadges: false,
    showImage: false
  };

  console.log("Patching settings to:", testSettings);

  const patchRes = await fetch(`http://localhost:5000/api/restaurants/id/${restaurantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuUiSettings: testSettings })
  });

  const patchJson = await patchRes.json();
  console.log("Patch response success:", patchJson.success);

  // Step 3: Fetch again to verify persistence
  const verifyRes = await fetch('http://localhost:5000/api/restaurants/kanpur/vis');
  const verifyJson = await verifyRes.json();
  console.log("Verified settings from DB:", verifyJson.data.menuUiSettings);
}

testSettingsApi().catch(console.error);
