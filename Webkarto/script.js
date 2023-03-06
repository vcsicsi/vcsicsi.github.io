//--------------------------------------------MAP------------------------------------------------------------------ 
var  map = L.map('map').setView([47.475,19.062], 7),
    varosok=L.layerGroup().addTo(map),
    stations=L.layerGroup().addTo(map),
    pontok=[],
    dolgok=L.layerGroup().addTo(map);

var stationsGeoJSON = {
        "type": "FeatureCollection",
        "features": []};

var stationIcon = L.icon ({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",                    
        iconSize:     [28, 45],
        iconAnchor: [14, 44],
        popupAnchor: [0, 0]});     

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            minZoom: 7,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.attributionControl.setPrefix();  

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
                stations_layer = L.geoJSON(feature,{
                                pointToLayer: function (feature, latlng) {
                                            return L.marker(latlng, {icon: stationIcon});
                                    }}).bindTooltip(row.StationNumber + ", "+ row.RegioName + "," + row.StationName + "," + row.Elevation + " m").addTo(stations);
                                    tooltip.push(row.StationNumber+","+row.StationName+","+row.Elevation+" m"+","+row.Latitude+","+row.Longitude);
                stationsGeoJSON.features.push(feature)})}
            });
        });       

// --------------FUNCTION: ------------------------   
function kereses() {                   
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
                                    pont=l.getLayers()[0]}                               
                            })
                            pontok[1]= pont.getLatLng();
                            console.log(pontok);
                            L.polyline(pontok).addTo(dolgok)
                                .bindPopup("Distance: "+(dmin/1000).toFixed(2)+" km")
                                .openPopup()});
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
                            pont=l.getLayers()[0]}
                    })
    pontok[1]=pont.getLatLng();
    console.log(pontok);                				
    L.polyline(pontok).addTo(dolgok)
            .bindPopup("Distance: "+(dmin/1000).toFixed(2)+" km")
            .openPopup();				
        });			        

//----------------------------------------------Graph --------------------------------------------------------------   
function statkeres(value) {
    // metdata fom zip file
    var code=document.getElementById("code").value;
    var headdropdown = document.getElementById("valt");
    if (code.length<1) code=44527;
    var zip = new JSZip();
    var zip2 = new JSZip();
    const datum=[];
    const akthom=[];
    const akthoms=[];
    let url= 'http://terkeptar.elte.hu/~saman/get.php?url=https://odp.met.hu/climate/observations_hungary/10_minutes/now/HABP_10M_'+code+'_now.zip';    
    let url2= 'http://terkeptar.elte.hu/~saman/get.php?url=https://odp.met.hu/climate/observations_hungary/hourly/now/HABP_1H_'+code+'_now.zip';    
    fetch(url/*'./Webkarto/HABP_10M_13704_now.zip'*/)
            .then(r=>r.arrayBuffer())
                .then(d=>zip.loadAsync(d))
                    .then(z=>z.file(/./)[0].async("text"))
                        .then(d=>{
                            let sorok=d.split('\n');
                            //select    
                            const head = sorok[5].split(";");
                            header = [head.length];
                            for (let i=0; i < head.length; i++) {
                                header[i] = head[i].trim()};
                            let headerr=[];
                            headerr = header.filter((hr) => ! hr.startsWith("Q_"));
                            for (let key=2; key<headerr.length-1; key++) {
                                if(headdropdown.length != headerr.length - 3) {
                                let option = document.createElement("option");
                                if (key == 2) {
                                        option.setAttribute("value",key);
                                    }else{
                                        option.setAttribute("value",key + key-2)};
                                        option.text = headerr[key];
                                        headdropdown.add(option); 
                                    }else
                                        break};
                            var rr=document.getElementById("valt").value;
                            //data    
                            for (let i=7;i<sorok.length;i++) {
                                let adatok=sorok[i].split(';');
                                for (let j in adatok) {
                                    adatok[j]=adatok[j].trim()}
                                //console.log(adatok.join(","))
                                if (adatok.length<2) continue;
                                let a=adatok[1];
                                let d=a.substr(0,4)+"-"+a.substr(4,2)+"-"+a.substr(6,2)+"T"+a.substr(8,2)+":"+a.substr(10,2)+"Z";
                                datum.push(d);
                                akthom.push(Number(adatok[rr]))}
                            // smooth
                            if (header[rr] == "t" || header[rr] =="ta" || header[rr] =="tx"|| header[rr] =='tn') {
                            for (let i=1; i<akthom.length-1; i++) {
                                akthoms[i]=(akthom[i-1]+akthom[i]+akthom[i+1])/3;}
                                }
                            for (let i=0;i<tooltip.length;i++){
                            if (Number(tooltip[i].substr(0,5)) == code) {
                                var name = tooltip[i]}};
                            // Define Data
                            var data1 = {
                                x: datum, y: akthom,
                                mode:"lines", type:"scatter",
                                line: {shape: 'spline', color:'rgb(142, 124, 195)', width:3}}; 
                            var data2 = {   
                                x: datum,y: akthoms,
                                mode:"lines", type:"scatter",
                                line: {shape: 'spline', color:'rgb(234, 153, 153)', width: 2},
                                name: 'Smooth'};
                            var data = [data1, data2];

                            //Annonation
                            var aktualann = []
                            if (header[rr] == "t" || header[rr] =="ta" || header[rr] =="tx"|| header[rr] =='tn'|| header[rr] =='et5' || header[rr] =='et10' || header[rr] =='et20' || header[rr] =='et50' || header[rr] =='et100' || header[rr] =='tviz' || header[rr] =='tsn') {
                                 aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' °C';
                            } else if (header[rr] == "r") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' mm';      
                            } else if (header[rr] == "u") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' %';      
                            } else if (header[rr] == "p") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' hpa';      
                            } else if (header[rr] == "fx" | header[rr] == "fs") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' m/s';      
                            } else if (header[rr] == "fxd" | header[rr] == "fsd") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' °';                                     
                            } else if (header[rr] == "sg" | header[rr] == "sg") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' nSv/h';                                     
                            } else if (header[rr] == "suv" | header[rr] == "suv") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' MED/h';                                     
                            } else if (header[rr] == "sr" | header[rr] == "sr") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' W/m²';                                     
                            } else if (header[rr] == "v" | header[rr] == "sr") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' m';                                     
                            } else if (header[rr] == "fxm" | header[rr] == "fxm") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + " '";                                     
                            } else if (header[rr] == "fxs" | header[rr] == "fxs") {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1] + ' "' ;                                     
                            } else {
                                aktualann = 'Aktuális: '+akthom[akthom.length-1];}

                            // Define Layout
                            var layout = {
                            hovermode:'closest',    
                            xaxis:{title: {text: "Time UTC 10min",  font:{size: 12}},},  
                            yaxis:{title:{text: "",  font: {size: 12}},},
                            title:{text: name.split(",")[1]+name.split(",")[2], font: {size: 14}},
                            automargin: true,
                            annotations: [{ text: aktualann,
                                            font: {size: 12, color: 'rgb(116, 101, 130)', },
                                            showarrow: false,align: 'left',
                                            x: 1,y: 1.05,
                                            xref: 'paper', yref: 'paper',}]};

                            var config = {responsive: true}
                            Plotly.newPlot("myPlot", data, layout, config);                       
                            
                            //sunset times
                            var met = document.getElementById("met");
                            var sr = document.getElementById("sunrise");
                            var ss = document.getElementById("sunset");
                            // get today's sunlight times for station
                            var times = SunCalc.getTimes(new Date(), name.split(",")[3], name.split(",")[4]);
                            // format sunrise time from the Date object
                            var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
                            var sunsetStr  = times.sunset.getHours() + ':' + times.sunset.getMinutes();

                            var mets = document.createTextNode(name.split(",")[1]);
                            var textrise = document.createTextNode(sunriseStr);
                            var textset = document.createTextNode(sunsetStr);
                            sr.innerHTML = '';
                            ss.innerHTML = '';
                            met.innerHTML = '';
                            sr.appendChild(textrise);
                            ss.appendChild(textset);
                            met.appendChild(mets);

                            var ta = document.getElementById("ta");
                            var tas = document.createTextNode(sorok[sorok.length-2].split(";")[4]+" °C");
                            ta.innerHTML = '';
                            ta.appendChild(tas);

                            var fs = document.getElementById("fs");
                            var fas = document.createTextNode(sorok[sorok.length-2].split(";")[24]+" m/s");
                            fs.innerHTML = '';
                            fs.appendChild(fas);

                            var fsd = document.getElementById("fsd");
                            var fsds = document.createTextNode(sorok[sorok.length-2].split(";")[26]+" °");
                            fsd.innerHTML = '';
                            fsd.appendChild(fsds);

                            var fx = document.getElementById("fx");
                            var fxs = document.createTextNode(sorok[sorok.length-2].split(";")[28]+" m/s");
                            fx.innerHTML = '';
                            fx.appendChild(fxs);

                            var p = document.getElementById("p");
                            var ps = document.createTextNode(sorok[sorok.length-2].split(";")[14]+" hpa");
                            p.innerHTML = '';
                            p.appendChild(ps);                            
                        }); 
        
    //jelenido oras adat beolvasasa
            fetch(url2)
                .then(r=>r.arrayBuffer())
                    .then(d=>zip2.loadAsync(d))
                        .then(z=>z.file(/./)[0].async("text"))
                            .then(d=>{
                                    let sorok=d.split('\n');
                                    for (let i=7;i<sorok.length;i++) {
                                        let adatok=sorok[i].split(';');
                                        for (let j in adatok) {
                                            adatok[j]=adatok[j].trim()}
                                        if (adatok.length<2) continue; 
                                    };
                                    var jelenido = sorok[sorok.length-2].split(";")[34];
                                    console.log(jelenido);                                   
                                    if (jelenido == 1)  {
                                        document.getElementById("jelenido").innerHTML = " derült";
                                        document.getElementById("jelenimg").src = "/jelenido/";
                                    }else if (jelenido == 2) {
                                        document.getElementById("jelenido").innerHTML = " kissé felhős";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 3) {
                                        document.getElementById("jelenido").innerHTML =  " közepesen felhős";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 4) {
                                        document.getElementById("jelenido").innerHTML = " erősen felhős";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 5) {
                                        document.getElementById("jelenido").innerHTML = " borult";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 6) {
                                        document.getElementById("jelenido").innerHTML = " fátyolfelhős";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 7) {
                                        document.getElementById("jelenido").innerHTML = " ködös";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 9) {
                                        document.getElementById("jelenido").innerHTML = " derült, párás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 10) {
                                        document.getElementById("jelenido").innerHTML = " közepesen felhős, párás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 11) {
                                        document.getElementById("jelenido").innerHTML = " borult, párás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 12) {
                                        document.getElementById("jelenido").innerHTML = " erősen fátyolfelsős";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 101) {
                                        document.getElementById("jelenido").innerHTML = " szitálás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 102) {
                                        document.getElementById("jelenido").innerHTML = " eső";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 103) {
                                        document.getElementById("jelenido").innerHTML = " zápor",
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 104) {
                                        document.getElementById("jelenido").innerHTML = " zivatar esővel";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 105) {
                                        document.getElementById("jelenido").innerHTML = " ónos szitálás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 106) {
                                        document.getElementById("jelenido").innerHTML = " ónos eső";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 107) {
                                        document.getElementById("jelenido").innerHTML = " hószállingózás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 108) {
                                        document.getElementById("jelenido").innerHTML =" havazás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 109) {
                                        document.getElementById("jelenido").innerHTML =" hózápor";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 110) {
                                        document.getElementById("jelenido").innerHTML = " havaseső";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 112) {
                                        document.getElementById("jelenido").innerHTML =" hózivatar";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 202) {
                                        document.getElementById("jelenido").innerHTML =" erős eső";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 203) {
                                        document.getElementById("jelenido").innerHTML =" erős zápor";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 208) {
                                        document.getElementById("jelenido").innerHTML =" erős havazás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 209) {
                                        document.getElementById("jelenido").innerHTML = " erős hózápor";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 304) {
                                        document.getElementById("jelenido").innerHTML =" zivatar záporral";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 310) {
                                        document.getElementById("jelenido").innerHTML =" havaeső zápor";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 500) {
                                        document.getElementById("jelenido").innerHTML =" hófúvás";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 600) {
                                        document.getElementById("jelenido").innerHTML =" jégeső";
                                        document.getElementById("jelenimg").src = "";
                                    }else if (jelenido == 601) {
                                        document.getElementById("jelenido").innerHTML = " dörgés";
                                        document.getElementById("jelenimg").src = "";
                                    }else {
                                        document.getElementById("jelenido").innerHTML = " NO DATA";
                                        document.getElementById("jelenimg").src = "";
                                    }
                                });
    };


//Press Enter hely kereses    
var input = document.getElementById("code");
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("Btn1").click();
    }   
});  

document.getElementById("Btn1").click();


function moonphase( date ) {
    date.setTime( date.getTime() + date.getTimezoneOffset() * 60000 );
   var bluemoon = new Date( 96, 1, 3, 16, 15, 0 ),
     lunarperiod = 29 * ( 24 * 3600 * 1000 ) + 12 * ( 3600 * 1000 ) + 44.05 * ( 60 * 1000 ),
     phasetime = ( date.getTime() - bluemoon.getTime() ) % lunarperiod,
     fullmoon = Math.round( ( lunarperiod - phasetime ) / ( 24 * 3600 * 1000 ) ),
     fraction = phasetime / lunarperiod,
     percent = Math.round( 200 * fraction ) % 100;
     return(percent);
     
};

var moon = document.getElementById("moon");
var calc = document.createTextNode(moonphase(new Date())+"%");
moon.appendChild(calc);
