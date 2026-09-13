import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,AppState,Easing,Image,View} from 'react-native';

export default function MizeCelebration(){
 const progress=useRef(new Animated.Value(0)).current;
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{let active=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{active=false;sub.remove();};},[]);
 useEffect(()=>{
  const animation=Animated.loop(Animated.sequence([
   Animated.timing(progress,{toValue:1,duration:600,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),
   Animated.timing(progress,{toValue:0,duration:500,easing:Easing.out(Easing.quad),useNativeDriver:true}),
   Animated.delay(900),
  ]));
  const update=()=>{animation.stop();progress.setValue(0);if(!reduced&&AppState.currentState==='active')animation.start();};
  update();const sub=AppState.addEventListener('change',update);return()=>{sub.remove();animation.stop();};
 },[reduced,progress]);
 return <View accessible accessibilityRole="image" accessibilityLabel="Mize celebrates with both arms raised" style={{width:210,height:270,alignSelf:'center',marginTop:12,paddingTop:16}}><Animated.View style={{flex:1,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,-14]})},{rotate:progress.interpolate({inputRange:[0,1],outputRange:['0deg','-3deg']})}]}}><Image accessible={false} source={require('../assets/mize-celebrate.png')} style={{width:'100%',height:'100%',resizeMode:'contain'}}/></Animated.View></View>;
}
