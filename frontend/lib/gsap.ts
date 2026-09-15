'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

// Registro único de plugins: todo componente animado importa gsap desde aquí.
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
gsap.defaults({ ease: 'expo.out', duration: 1 });

export { gsap, ScrollTrigger, SplitText };
