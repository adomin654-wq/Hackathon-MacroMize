import React,{useEffect,useState} from 'react';
import {AccessibilityInfo,AppState,Image,StyleSheet,View,type StyleProp,type ViewStyle} from 'react-native';
import {useVideoPlayer,VideoView} from 'expo-video';

/** A silent greeting with optional looping and a static reduced-motion fallback. */
export default function MizeMascot({style,label='Mize, your avocado guide',loop=false}:{style:StyleProp<ViewStyle>;label?:string;loop?:boolean}) {
 const [reduced,setReduced]=useState(true),[failed,setFailed]=useState(false),[frame,setFrame]=useState(false);
 const player=useVideoPlayer(require('../assets/mize-wave.mp4'),p=>{p.muted=true;p.loop=loop;p.audioMixingMode='mixWithOthers';});
 useEffect(()=>{
  let active=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduced(value);}).catch(()=>{});
  const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  return()=>{active=false;subscription.remove();};
 },[]);
 useEffect(()=>{
  const subscription=player.addListener('statusChange',({status})=>{if(status==='error')setFailed(true);});
  return()=>subscription.remove();
 },[player]);
 useEffect(()=>{
  player.loop=loop;
  const update=()=>{if(reduced||failed||AppState.currentState!=='active')player.pause();else if(loop||player.duration===0||player.currentTime<player.duration)player.play();};
  update();const subscription=AppState.addEventListener('change',update);
  return()=>subscription.remove();
 },[player,reduced,failed,loop]);
 return <View style={style} accessible accessibilityRole="image" accessibilityLabel={label}>
  {!reduced&&!failed&&<VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" fullscreenOptions={{enable:false}} allowsPictureInPicture={false} onFirstFrameRender={()=>setFrame(true)} accessible={false}/>}
  {(!frame||reduced||failed)&&<Image source={require('../assets/mize-wave.png')} style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',resizeMode:'contain'}]} accessible={false}/>}
 </View>;
}
