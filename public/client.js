const icons = {
    Ampol: "/images/ampol.jpeg",
    BP: "/images/bp.png",
    Caltex: "/images/caltex.png",
    Shell: "/images/shell.png",
    '7-Eleven Pty Ltd': "/images/seven-eleven.png",
    Generic: "/images/generic.jpg",
}

let map;

async function initMap() {
    const centerLat = document.getElementById('center-lat')
    const centerLng = document.getElementById('center-lng')
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        // center: { lat: -37.9338, lng: 145.0726 },
        zoom: 13,
        minZoom: 10,
    });

    function success(position) {
        // Center on user's current location if geolocation prompt allowed
        let userLat = position.coords.latitude;
        let userLng = position.coords.longitude;
        map.setCenter({ lat: userLat, lng: userLng });

        centerLat.innerHTML = 'lat: ' + map.getCenter().lat()
        centerLng.innerHTML = 'lng: ' + map.getCenter().lng()
    }
    function error(err) {
        // User denied geolocation prompt - default to Chicago
        map.setCenter({ lat: -37.9338, lng: 145.0726 });
        centerLat.innerHTML = 'lat: ' + '-37.9338'
        centerLng.innerHTML = 'lng: ' + '145.0726'
    }
    navigator.geolocation.getCurrentPosition(success, error)


    map.addListener("center_changed", () => {
        let center = map.getCenter();
        let latitude = center.lat();
        let longitude = center.lng();

        centerLat.innerHTML = 'lat: ' + latitude
        centerLng.innerHTML = 'lng: ' + longitude
    });

    const infoWindow = new google.maps.InfoWindow({
        // content: contentString,
        // ariaLabel: station.name,
    });

    map.addListener('idle', () => {
        // When the map is idle, the map box's boundaries are extracted
        const { lo: lowerLat, hi: upperLat } = map.getBounds().Va;
        const { lo: lowerLng, hi: upperLng } = map.getBounds().Ga;

        // An API axios request is made to retrieve the stations within the coordinate boundaries set by the map box
        const boundsQueryString = `?lowerlat=${lowerLat}&upperlat=${upperLat}&lowerlng=${lowerLng}&upperlng=${upperLng}`
        
        axios.get(`/api/stations/bounds${boundsQueryString}`).then(stations => {

            for (const station of stations.data) {

                const myLatLng = { lat: station.latitude, lng: station.longitude };

                const image = {
                    url: icons[station.owner] || icons.Generic,
                    scaledSize: new google.maps.Size(25, 25),
                    origin: new google.maps.Point(0, 0), // origin
                    anchor: new google.maps.Point(0, 0) // anchor
                };

                const marker = new google.maps.Marker({
                    position: myLatLng,
                    map,
                    title: station.name,
                    // label: station.name,
                    icon: image
                });

                const contentString = `<div><h3>${station.name}</h3> <p>${station.address}</p></div>`

                marker.addListener("click", () => {
                    infoWindow.close()
                    infoWindow.setContent(contentString)
                    infoWindow.open({
                        anchor: marker,
                        map,
                    });
                });

                marker.addListener("mouseover", () => {
                    marker.label = station.name
                })
                // marker.addListener('mouseover', function() {
                //     infoWindow.setContent(`<h3>${station.name}</h3>`)
                //     infoWindow.open({
                //       anchor: marker,
                //       map,
                //     }); 
                // });
                // marker.addListener('mouseout', function() {
                //     infoWindow.close();
                // });
            };
        });
        
        // When idle, send a request to the api/stations/nearest
        // Provide latitude, longitude, radius
        const centerLat = map.getCenter().lat();
        const centerLng = map.getCenter().lng();
        
        // Radius: selected based on smaller of the two (vertical/horizontal)
        const latRadius = (upperLat - lowerLat) / 2;
        const lngRadius = (upperLng - lowerLng) / 2;
        const radius = Math.min(latRadius, lngRadius)

        // Send a GET request, providing this query string
        const proximityQueryString = `?lat=${centerLat}&lng=${centerLng}&radius=${radius}`;
        axios.get(`/api/stations/nearest${proximityQueryString}`)
            .then(stations => console.log(stations.data))
        ;


    })
}

initMap();

