geocoder.geocode(
  { location: { lat, lng } },
  (
    results: google.maps.GeocoderResult[] | null,
    status: google.maps.GeocoderStatus
  ) => {
    if (status === 'OK' && results?.[0]) {
      placeMarker(lat, lng, results[0].formatted_address);
    } else {
      placeMarker(lat, lng);
    }
  }
);