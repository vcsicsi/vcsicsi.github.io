//--------------------------------------------MAP------------------------------------------------------------------ 
var  map = L.map('map').setView([47.475,19.062], 7),
    varosok=L.layerGroup().addTo(map),
    stations=L.layerGroup().addTo(map),
    pontok=[],
    dolgok=L.layerGroup().addTo(map);

var stationsGeoJSON = {
        "type": "FeatureCollection",
        "features": [ ]};

var stationIcon = L.icon ({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",                    
        iconSize:     [28, 45],
        iconAnchor: [14, 44],
        popupAnchor: [0, 0],});     

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            minZoom: 7,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.attributionControl.setPrefix(
        'View <a href="https://github.com/HandsOnDataViz/leaflet-map-csv" target="_blank">map-csv code on GitHub</a>'
                    );  

var tooltip=[];                    
//stations layergroup
let url = "http://terkeptar.elte.hu/~saman/get.php?url=https://odp.met.hu/climate/observations_hungary/10_minutes/station_meta_auto.csv"   
$.get(url/*-'./data.csv'*/, function(csv) {
var data = Papa.parse(csv, {header: true, download: false, encoding: "UTF-8", delimiter: ";", 
            skipEmptyLines: true, dynamicTyping: true, 
            transformHeader:function(h) {
            return h.trim()},
            complete: function(results) {
                results.data.forEach((row) => {
                feature = {"type": "Feature",
                            "geometry": {
                            "type": "Point",
                            "coordinates": [row.Longitude, row.Latitude] },
                            "properties": {
                            "Location": row.StationName }}
                stations_layer = L.geoJSON(feature, {
                                pointToLayer: function (feature, latlng) {
                                            return L.marker(latlng, {icon: stationIcon});
                                    }}).bindTooltip(row.StationNumber + ", "+ row.RegioName + "," + row.StationName + "," + row.Elevation + " m").addTo(stations);
                                    tooltip.push(row.StationNumber+","+row.StationName+""+row.Elevation+" m");
                stationsGeoJSON.features.push(feature)
                })    
            }
            });
        });       

// --------------FUNCTION: ------------------------   
function kereses() {                   
// megkeressük a 'hely' id-jű elemet és a beleírt értéket eltároljuk
var h=document.getElementById("hely").value;
var url="https://nominatim.openstreetmap.org/search/place?format=geojson&country=Hungary&city="+h;
    fetch(url).then(r=>r.json()).then(data=>{
        var eredmeny=L.geoJson(data).addTo(varosok).bindTooltip(tooltipszöveg);
            eredmeny.on('click',e=>{
                    let hely=e.latlng;
                    pontok[0] = e.latlng;
                    let dmin=21000000; // ennél semmi sem lehet messzebb a földön
                    let pont;
                    stations.eachLayer(l=>{
                        let d=hely.distanceTo(l.getLayers()[0].getLatLng());
                        if (d<dmin) {
                            dmin=d;
                            pont=l.getLayers()[0];
                        }                               
                    })
                    pontok[1]= pont.getLatLng();
                    console.log(pontok);
                    //pont.bindPopup('Ez a legközelebbi hely. Távolság: '+(dmin/1000).toFixed(2)+'km').openPopup();         
                    L.polyline(pontok).addTo(dolgok)
                        .bindPopup("Distance: "+(dmin/1000).toFixed(2)+" km")
                        .openPopup();
                                });
        map.fitBounds(eredmeny.getBounds(), {
            padding: [50, 50]
                });                                   
                            });        
//clear text        
document.getElementById("hely").value="";
};

//x clear map
function clearmap() {                   
    varosok.clearLayers();
    dolgok.clearLayers();
};

//Press Enter hely search
var input = document.getElementById("hely");
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("Btn").click();
        event.currentTarget.value = "";
    }
});

//tooltip a geocoding      
function tooltipszöveg (layer){
var prop = layer.feature.properties;
return (prop.icon?('<img src="'+prop.icon+'">'):'')
        +layer.feature.properties.display_name;
}; 

//----------------------------------search by click ---------------------------------------------------            
var n=0;
map.on('click', function(e) {
    //marker
        n++;
        let helyid = e.latlng;
        L.marker(e.latlng).addTo(dolgok)
            .bindPopup(n+'.pont')
            .openPopup();
        pontok[0]=e.latlng;
        let dmin=21000000; // max
        let pont;
    stations.eachLayer(l=>{
        let d=helyid.distanceTo(l.getLayers()[0].getLatLng());
                        if (d<dmin) {
                            dmin=d;
                            pont=l.getLayers()[0];
                        }
                    })
    pontok[1]=pont.getLatLng();
    console.log(pontok);                				
    L.polyline(pontok).addTo(dolgok)
            .bindPopup("Distance: "+(dmin/1000).toFixed(2)+" km")
            .openPopup();				
        });			        

// find me : map.locate({setView: true, maxZoom: 16});
//https://leafletjs.com/examples/mobile/                                                             

//----------------------------------------------Graph --------------------------------------------------------------   
function statkeres() {
    // metdata fom zip file
    var code=document.getElementById("code").value;
    if (code.length<1) code=44527;
    var zip = new JSZip();
    const datum=[];
    const akthom=[];
    const akthoms=[];
    let url= 'http://terkeptar.elte.hu/~saman/get.php?url=https://odp.met.hu/climate/observations_hungary/10_minutes/now/HABP_10M_'+code+'_now.zip';    
    fetch(url/*'./Webkarto/HABP_10M_13704_now.zip'*/)
            .then(r=>r.arrayBuffer())
                .then(d=>zip.loadAsync(d))
                    .then(z=>z.file(/./)[0].async("text"))
                        .then(d=>{
                            let sorok=d.split('\n');
                            for (let i=7;i<sorok.length;i++) {
                                let adatok=sorok[i].split(';');
                                for (let j in adatok) {
                                    adatok[j]=adatok[j].trim();
                                }
                                //console.log(adatok.join(","))
                                if (adatok.length<2) continue;
                                let a=adatok[1];
                                let d=a.substr(0,4)+"-"+a.substr(4,2)+"-"+a.substr(6,2)+"T"+a.substr(8,2)+":"+a.substr(10,2)+"Z";
                                datum.push(d);
                                akthom.push(Number(adatok[4]));
                            }
                            // smooth
                              for (let i=1; i<akthom.length-1; i++)
                                  akthoms[i]=(akthom[i-1]+akthom[i]+akthom[i+1])/3;
                            for (let i=0;i<tooltip.length;i++){
                            if (Number(tooltip[i].substr(0,5)) == code) {
                                var name = tooltip[i];
                            }};

                            // Define Data
                            var data1 = {
                                x: datum,
                                y: akthom,
                                mode:"lines",
                                type:"scatter",
                                line: {shape: 'spline', color:'rgb(142, 124, 195)', width:3},
                                name: 'Original'
                            };
                            
                            var data2 = {   
                                x: datum,
                                y: akthoms,
                                mode:"lines",
                                type:"scatter",
                                line: {shape: 'spline', color:'rgb(234, 153, 153)', width: 2},
                                name: 'Smooth'
                            };
                            
                            var data = [data1, data2];

                            // Define Layout
                            var layout = {
                            hovermode:'closest',    
                            xaxis: {title: 
                                {text: "Time UTC 10min", 
                                font: { 
                                    size: 12 
                                    }
                                },
                            },  
                            yaxis: {
                                title: {
                                    text: "Temperature in °C", 
                                    font: {
                                        size: 12
                                    }
                                },
                            },
                            title:  {
                                text: name, 
                                font: {
                                    size: 14}
                                },
                            automargin: true,
                            annotations: [{
                                text: 'Aktuális: '+akthom[akthom.length-1] + ' °C',
                                  font: {
                                  size: 12,
                                  color: 'rgb(116, 101, 130)',
                                },
                                showarrow: false,
                                align: 'left',
                                x: 1,
                                y: 1.05,
                                xref: 'paper',
                                yref: 'paper',
                              }]
                            };

                            var config = {responsive: true}

                            Plotly.newPlot("myPlot", data, layout, config);

                        }); 
        document.getElementById("code").value="";                           
        };


//Press Enter hely kereses    
var input = document.getElementById("code");
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("Btn1").click();
        event.currentTarget.value = "";
    }   
});  

document.getElementById("Btn1").click();
