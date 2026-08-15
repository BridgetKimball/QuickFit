export function rowToClosetItem(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    baseColor: row.base_color,
    pattern: row.pattern,
    material: row.material,
    type: row.type,
    style: row.style,
    skirtLength: row.skirt_length,
    dressLength: row.dress_length,
    sleeveLength: row.sleeve_length,
    jewelryType: row.jewelry_type,
    theme: row.theme,
    isFavorite: !!row.is_favorite,
    photo: row.photo,
  };
}

export function rowToProfile(row) {
  return {
    temperatureBias: row.temperature_bias,
    profileStyle: row.profile_style,
    presentation: row.presentation,
  };
}

export function rowToFavoriteOutfit(row) {
  return {
    id: row.id,
    planner: JSON.parse(row.planner_json),
    topItemId: row.top_item_id,
    bottomItemId: row.bottom_item_id,
    layerItemId: row.layer_item_id,
    accessoryItemIds: JSON.parse(row.accessory_item_ids_json),
    shoesItemId: row.shoes_item_id,
    tuckedIn: !!row.tucked_in,
    jacketClosed: !!row.jacket_closed,
    createdAt: row.created_at,
  };
}
