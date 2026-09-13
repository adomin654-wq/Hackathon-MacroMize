"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { restaurantKey, type Match } from "@/lib/macromize";

type Props={location:{lat:number;lon:number;current?:boolean}|null;matches:Match[];selectedId:string|null;onSelect:(meal:Match)=>void};
export default function MealMap({location,matches,selectedId,onSelect}:Props){
 const element=useRef<HTMLDivElement>(null),map=useRef<Leaflet.Map|null>(null),library=useRef<typeof Leaflet|null>(null),markers=useRef<Leaflet.LayerGroup|null>(null);
 const select=useRef(onSelect);select.current=onSelect;
 const [ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{let disposed=false;void import("leaflet").then(L=>{if(disposed||!element.current)return;library.current=L;const instance=L.map(element.current,{zoomControl:false,attributionControl:true,minZoom:3,maxZoom:19}).setView([50,10],5);map.current=instance;
 const tiles=L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{subdomains:"abc",maxNativeZoom:17,maxZoom:19,className:"terrain-tiles",attribution:'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'}).addTo(instance);
 tiles.on("tileerror",()=>setError(true));tiles.on("load",()=>setError(false));markers.current=L.layerGroup().addTo(instance);setReady(true);
 }).catch(()=>setError(true));return()=>{disposed=true;map.current?.remove();map.current=null;};},[]);
 useEffect(()=>{if(ready&&location)map.current?.setView([location.lat,location.lon],15,{animate:true});},[ready,location]);
 useEffect(()=>{const L=library.current,group=markers.current;if(!ready||!L||!group)return;group.clearLayers();
 if(location){const dot=document.createElement("span");dot.className=location.current?"user-map-dot":"search-map-dot";L.marker([location.lat,location.lon],{icon:L.divIcon({html:dot,className:"user-map-marker",iconSize:[18,18]}),interactive:false}).addTo(group);}
 const seen=new Set<string>();for(const meal of matches){const placeKey=restaurantKey(meal);if(seen.has(placeKey))continue;seen.add(placeKey);const count=matches.filter(m=>restaurantKey(m)===placeKey).length;const pin=document.createElement("div");pin.className="meal-map-pin"+(matches.some(m=>m.id===selectedId&&restaurantKey(m)===placeKey)?" is-selected":"");const logo=document.createElement("img");logo.src="/brand-pin.svg";logo.alt="";logo.width=48;logo.height=53;pin.appendChild(logo);const label=document.createElement("span");label.textContent=count>1?`${count} meals`:"1 meal";pin.appendChild(label);const marker=L.marker([meal.lat,meal.lon],{icon:L.divIcon({html:pin,className:"meal-map-marker",iconSize:[58,66],iconAnchor:[29,64]}),title:`${meal.restaurant} · ${count} meals`,keyboard:true}).addTo(group);marker.on("click",()=>select.current(meal));}
 },[ready,location,matches,selectedId]);
 const boundsKey=matches.map(m=>`${m.lat},${m.lon}`).join('|');
 useEffect(()=>{if(!ready||!map.current||!location)return;const points:[number,number][]=[[location.lat,location.lon],...matches.map(m=>[m.lat,m.lon] as [number,number])];map.current.fitBounds(points,{padding:[38,38],maxZoom:15});},[ready,location?.lat,location?.lon,boundsKey]);
 return <><div ref={element} className="live-map" role="region" aria-label="Nearby meal terrain map"/>{error&&<p className="map-error" role="status">The map couldn’t load. Recommendations are still available below.</p>}</>;
}
