'use client';
import { useEffect, useState } from 'react';
import { Wave } from './Studio';
export default function Intro(){const [show,setShow]=useState(false);useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('vaa-intro'))return;setShow(true);const timer=setTimeout(()=>{setShow(false);sessionStorage.setItem('vaa-intro','1')},1500);return()=>clearTimeout(timer)},[]);return show?<div className="intro" role="status"><span className="eyebrow">VIRTUAL AGENT AI</span><Wave compact/><button onClick={()=>{setShow(false);sessionStorage.setItem('vaa-intro','1')}}>Skip introduction →</button></div>:null}
