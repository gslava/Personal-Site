import { CITY_LIFE_SHADER } from './city-life-shader';
import { EARTH_SHADER } from './earth-shader';
/** Original real-time scenes. Artistic approximations, not physical simulators. */
export type CinematicScene = 'event-horizon' | 'neon-city' | 'abyssal-bloom';
export const CINEMATIC_SCENES: readonly string[] = ['event-horizon', 'neon-city', 'abyssal-bloom'];
const common = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float intensity;
uniform float palette;
uniform float camera;
uniform float eventKind;
uniform float eventPhase;
#define PI 3.14159265
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
 vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) { float v=0.,a=.5; for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.02+3.1;a*=.5;} return v; }
mat2 rot(float a) { return mat2(cos(a),-sin(a),sin(a),cos(a)); }
mat3 lookAt(vec3 eye,vec3 target) {
 vec3 forward=normalize(target-eye),right=normalize(cross(forward,vec3(0,1,0)));
 return mat3(right,cross(right,forward),forward);
}
vec3 stars(vec3 rd) {
 vec2 uv=vec2(atan(rd.z,rd.x),asin(clamp(rd.y,-1.,1.)));
 vec3 col=vec3(0.);
 for(int i=0;i<2;i++) {
  vec2 p=uv*(180.+float(i)*110.); vec2 id=floor(p),f=fract(p)-.5;
  float brightness=hash(id+13.1);
  float star=pow(max(0.,1.-length(f)*2.),12.)*step(.986,brightness);
  col+=mix(vec3(.45,.66,1.),vec3(1.,.8,.55),hash(id))*star*(1.+float(i));
 }
 return col;
}
// Scene pass stores tone-mapped linear color; the finishing pass applies bloom/gamma.
vec4 expose(vec3 color) { return vec4(1.-exp(-max(color,vec3(0.))),1.); }
`;

const blackHole = `
vec3 sky(vec3 rd) {
 vec2 p=vec2(atan(rd.z,rd.x),asin(clamp(rd.y,-1.,1.)));
 float band=exp(-pow((p.y+.45*sin(p.x*.7)) * 3.5,2.));
 float cloud=fbm(p*4.2);
 vec3 nebula=mix(vec3(.045,.055,.13),vec3(.18,.08,.045),cloud);
 return stars(rd)*.65+nebula*band*cloud*.6+vec3(.001,.002,.006);
}
vec3 disc(vec3 p) {
 float radius=length(p.xz),angle=atan(p.z,p.x);
 float winding=angle-radius*.65+time*(.28+1.4/pow(radius,1.5));
 float turbulence=noise(vec2(winding*12.,radius*8.));
 float ribbons=.5+.5*sin(radius*38.+turbulence*3.+winding*2.);
 float filaments=.5+.5*sin(radius*92.+winding*8.+noise(p.xz*4.)*2.);
 float inner=smoothstep(1.48,1.85,radius),outer=1.-smoothstep(4.2,5.8,radius);
 float heat=pow(2.2/max(radius,1.5),1.5);
 vec3 fire=mix(vec3(1.1,.18,.018),vec3(1.8,.92,.38),clamp(heat*.6,0.,1.));
 vec3 ice=mix(vec3(.03,.28,1.2),vec3(.65,1.4,1.7),clamp(heat*.6,0.,1.));
 vec3 tint=mix(fire,ice,palette);
 float doppler=clamp(1.+p.x/radius*.62,.25,1.7);
 return tint*inner*outer*heat*(.38+ribbons*.5+filaments*.15)*doppler*intensity;
}
void main() {
 vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 float orbit=pointer.x*.42;
 float elevation=.20+pointer.y*.18;
 float distance=13.;
 if(camera>.5 && camera<1.5){elevation=.85+pointer.y*.3;distance=13.;}
 if(camera>1.5){elevation=.06+pointer.y*.1;distance=8.5;}
 vec3 ro=vec3(sin(orbit)*distance,sin(elevation)*distance,cos(orbit)*distance);
 vec3 rd=lookAt(ro,vec3(0))*normalize(vec3(uv*max(1.,resolution.y/resolution.x*1.3),1.18));
 vec3 p=ro,color=vec3(0.); float transmission=1.; bool captured=false;
 for(int i=0;i<112;i++) {
  float r=length(p);
  if(r<1.02){captured=true;break;}
  if(r>22.)break;
  float stepSize=clamp(r*.085,.055,.65);
  vec3 old=p;
  // A bounded curved-ray integration: an artistic lens, not a relativistic solver.
  rd=normalize(rd-p*(stepSize*1.35/(r*r*r)));
  p+=rd*stepSize;
  float radius=length(p.xz);
  if(radius>1.48 && radius<5.8) {
   float thickness=.045+.012*radius;
   float density=exp(-abs(p.y)/thickness);
   float crossing=old.y*p.y<0. ? 1. : 0.;
   vec3 samplePoint=p;
   if(crossing>.5)samplePoint=mix(old,p,old.y/(old.y-p.y));
   float opacity=clamp(density*stepSize*5.+crossing*.5,0.,.8);
   vec3 emission=disc(samplePoint);
   color+=transmission*emission*opacity*2.;
   transmission*=1.-opacity*.58;
  }
  float photon=exp(-abs(r-1.48)*18.);
  color+=transmission*mix(vec3(1.,.43,.1),vec3(.1,.6,1.),palette)*photon*stepSize*.06;
 }
 if(!captured)color+=sky(rd)*transmission;
 gl_FragColor=expose(color);
}
`;

const city =
  CITY_LIFE_SHADER +
  `
const float BLOCK=3.2;
vec3 atmosphere(vec3 rd) {
 float horizon=exp(-abs(rd.y)*4.);
 vec3 color=mix(vec3(.013,.008,.025),vec3(.075,.12,.15),horizon);
 vec3 moonDir=normalize(vec3(-.6,.27,-1.));
 float moon=length(rd-moonDir);
 color+=vec3(.27,.42,.55)*exp(-moon*5.)*.12;
 color+=vec3(.65,.8,.9)*(1.-smoothstep(.046,.048,moon))*.6;
 color+=stars(rd)*smoothstep(0.,.3,rd.y)*.12;
 float clouds=fbm(rd.xz*5.+vec2(time*.008,0));
 color=mix(color,color*.4,clouds*.65);
 // Moving shafts cross the low cloud deck.
 for(int i=0;i<3;i++){
  float id=float(i),angle=sin(time*.15+id*2.)*.23-.2+id*.22;
  float beam=exp(-pow((rd.x-angle-rd.y*sin(time*.1+id)*.4)*55.,2.));
  color+=mix(vec3(.12,.45,.55),vec3(.55,.15,.35),mod(id,2.))*beam*smoothstep(-.1,.18,rd.y)*exp(-max(0.,rd.y)*2.)*.4;
 }
 return color;
}
float boxHit(vec3 ro,vec3 rd,vec3 center,vec3 size) {
 vec3 inv=1./(mix(vec3(-1.),vec3(1.),step(vec3(0),rd))*max(abs(rd),vec3(.00001)));
 vec3 a=(center-size-ro)*inv,b=(center+size-ro)*inv;
 vec3 lo=min(a,b),hi=max(a,b);
 float near=max(max(lo.x,lo.y),lo.z),far=min(min(hi.x,hi.y),hi.z);
 return far>max(near,0.) ? max(near,0.) : 10000.;
}
// Grid traversal skips empty streets; each block is evaluated from its integer address.
vec4 traceCity(vec3 ro,vec3 rd) {
 vec2 cell=floor(ro.xz/BLOCK),signRay=sign(rd.xz);
 vec2 inverse=1./max(abs(rd.xz),vec2(.00001));
 vec2 edge=(cell+step(vec2(0),rd.xz))*BLOCK;
 vec2 next=abs(edge-ro.xz)*inverse,delta=BLOCK*inverse;
 float ground=rd.y<-.0001 ? -ro.y/rd.y : 10000.;
 for(int i=0;i<72;i++) {
  float seed=hash(cell);
  float height=1.8+pow(seed,2.5)*15.;
  vec2 center=(cell+.5)*BLOCK;
  float footprint=.72+hash(cell+9.)*.38;
  float d=boxHit(ro,rd,vec3(center.x,height*.5,center.y),vec3(footprint,height*.5,footprint));
  float roofHeight=.25+seed*.7;
  float roof=boxHit(ro,rd,vec3(center.x,height+roofHeight*.5,center.y),vec3(footprint*.65,roofHeight*.5,footprint*.65));
  float spire=10000.;
  if(seed>.72)spire=boxHit(ro,rd,vec3(center.x,height+roofHeight+.6,center.y),vec3(.035,.6,.035));
  float hit=min(d,min(roof,spire));
  if(hit<ground && hit<min(next.x,next.y)+.001) return vec4(hit,cell,hit==spire?2.:(hit==roof?3.:1.));
  if(min(next.x,next.y)>min(ground,115.))break;
  if(next.x<next.y){cell.x+=signRay.x;next.x+=delta.x;}else{cell.y+=signRay.y;next.y+=delta.y;}
 }
 return vec4(min(ground,150.),cell,0.);
}
vec3 building(vec3 p,vec3 rd,vec2 cell,float kind,float travel) {
 float seed=hash(cell),height=1.8+pow(seed,2.5)*15.;
 vec2 center=(cell+.5)*BLOCK,local=p.xz-center;
 float width=.72+hash(cell+9.)*.38;
 vec3 normal=abs(local.x)>abs(local.y)?vec3(sign(local.x),0,0):vec3(0,0,sign(local.y));
 float roofHeight=.25+seed*.7;
 float top=kind>2.5?height+roofHeight:height;
 if(abs(p.y-top)<.03)normal=vec3(0,1,0);
 if(kind>2.5)width*=.65;
 float side=abs(normal.x)>.5?p.z:p.x;
 vec2 tiles=vec2(side*7.,p.y*5.5);
 vec2 f=fract(tiles);
 float glass=step(.16,f.x)*step(f.x,.77)*step(.18,f.y)*step(f.y,.72)*step(abs(normal.y),.1);
 float occupied=step(.34,hash(floor(tiles)+cell*31.));
 vec3 cool=vec3(.025,.72,.95);
 vec3 warm=mix(vec3(1.6,.035,.42),vec3(1.45,.78,.09),step(.68,seed));
 vec3 light=mix(vec3(.35,.53,.62),vec3(.8,.57,.28),step(.48,hash(cell+7.)));
 float diffuse=.12+.13*max(0.,dot(normal,normalize(vec3(-.5,1,.2))));
 vec3 color=vec3(.1,.14,.2)*diffuse;
 color+=atmosphere(reflect(rd,normal))*.16;
 float windowEnergy=mix(glass*occupied*(.35+.9*hash(floor(tiles)+cell*8.)),.19,smoothstep(35.,95.,travel))*step(abs(normal.y),.1);
 color+=windowEnergy*light*intensity*.65;
 float rim=1.-smoothstep(.016,.055,abs(min(abs(local.x),abs(local.y))-width));
 float trim=1.-smoothstep(.012,.04,abs(fract(p.y*.5)-.5));
 color+=cool*trim*.15*step(.68,seed);
 // Structural ribs, mechanical floors and illuminated advertising panels.
 float ribs=1.-smoothstep(.02,.07,abs(fract(side*2.)-.5));
 color*=1.-ribs*.45;
 float service=step(.87,fract(p.y*.38));
 color=mix(color,vec3(.024,.038,.047),service*.6);
 vec2 ad=vec2(fract(side*.31+seed),fract(p.y*.11+seed));
 float signPanel=step(.18,ad.x)*step(ad.x,.82)*step(height*.58,p.y)*step(p.y,height*.58+1.1)*step(.68,seed)*step(abs(normal.y),.1);
 vec2 glyph=fract(vec2(ad.x*11.,ad.y*20.));
 float strokes=max(step(.3,glyph.x)*step(glyph.x,.55),step(.35,glyph.y)*step(glyph.y,.5));
 color+=mix(warm,cool,step(.76,seed))*signPanel*(.10+strokes*.9)*intensity;
 // A few buildings carry full-height light strips instead of identical facades.
 color+=mix(cool,warm,step(.9,seed))*rim*.9*step(.82,seed);
 if(kind>1.5 && kind<2.5)color+=vec3(1.,.07,.03)*(.4+.2*sin(time*2.+seed*9.));
 color+=light*.025*pow(1.-abs(dot(normal,-rd)),3.);
 return color;
}
vec3 road(vec3 p) {
 vec2 local=mod(p.xz,BLOCK)-BLOCK*.5;
 float street=min(abs(local.x+BLOCK*.5),abs(local.y+BLOCK*.5));
 vec3 color=vec3(.012,.022,.034);
 float lane=exp(-pow((abs(local.x)-1.4)*90.,2.))+exp(-pow((abs(local.y)-1.4)*90.,2.));
 color+=vec3(.18,.2,.22)*lane*.3;
 float direction=step(0.,sin(p.x*2.));
 float along=p.z+time*(direction>.5?3.:-3.);
 float cars=pow(max(0.,sin(along*1.2+floor(p.x/BLOCK)*15.)),18.);
 float trail=exp(-pow((abs(local.x)-1.35)*35.,2.))*cars;
 color+=mix(vec3(1.,.035,.008),vec3(.6,.8,1.),direction)*trail*intensity*2.;
 float alongX=p.x-time*2.;
 color+=vec3(1.,.22,.03)*exp(-pow((abs(local.y)-1.35)*35.,2.))*pow(max(0.,sin(alongX*1.5+floor(p.z/BLOCK)*5.)),24.)*intensity;
 return color+street*.0001;
}
void main() {
 vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 uv*=max(1.,resolution.y/resolution.x*1.1);
 float travel=15.;
 vec3 ro=vec3(6.4,15.,travel),target=vec3(-2.,10.,travel-25.);
 if(camera>.5 && camera<1.5){ro=vec3(.02,1.35,travel);target=ro+vec3(0,.6,-12.);}
 if(camera>1.5){ro=vec3(9.,24.,travel);target=vec3(0,0,travel-15.);}
 target.x+=pointer.x*6.; target.y+=pointer.y*4.;
 mat3 view=lookAt(ro,target);
 vec3 rd=view*normalize(vec3(uv,1.05));
 vec4 hit=traceCity(ro,rd);vec3 p=ro+rd*hit.x;
 vec3 sky=atmosphere(rd),color=sky;
 if(hit.w>.5)color=building(p,rd,hit.yz,hit.w,hit.x);
 else if(p.y<.05) {
  color=road(p);
  vec3 reflected=reflect(rd,vec3(0,1,0));
  reflected.x+=sin(p.z*35.+p.x*13.)*.0018;
  vec4 reflection=traceCity(p+vec3(0,.025,0),reflected);
  vec3 reflectedColor=reflection.w>.5?building(p+reflected*reflection.x,reflected,reflection.yz,reflection.w,reflection.x):atmosphere(reflected);
  color+=reflectedColor*(.25+.55*pow(1.-abs(rd.y),3.))*exp(-reflection.x*.008);
 }
 float fog=1.-exp(-hit.x*.019);
 if(hit.x<149.)color=mix(color,atmosphere(vec3(rd.x,.025,rd.z)),fog);
 color=hologram(color,uv,view,ro,vec3(-3.,17.,-3.),6.5,hit.x,0.,vec3(1.3,.025,.48));
 color=hologram(color,uv,view,ro,vec3(9.,17.,-11.),8.,hit.x,2.5,vec3(.035,.9,1.2));
 color=aircraft(color,uv,view,ro,hit.x);
 if(camera<.5)color=balcony(color,(gl_FragCoord.xy-.5*resolution)/resolution.y);
 color=cityWeather(color,uv,rd,hit.x);
 gl_FragColor=expose(color*1.55);
}
`;

export const CINEMATIC_SHADERS: Record<CinematicScene, string> = {
  'event-horizon': common + blackHole,
  'neon-city': common + city,
  'abyssal-bloom': common + EARTH_SHADER,
};

/** Modest screen-space bloom and a lens finish; no textures or image downloads. */
export const CINEMATIC_FINISH = `
precision highp float;
uniform sampler2D scene;
uniform vec2 resolution;
uniform vec2 texel;
void main() {
 vec2 uv=gl_FragCoord.xy/resolution;
 vec3 color=texture2D(scene,uv).rgb;
 vec3 glow=vec3(0.);float weight=0.;
 for(int i=0;i<12;i++) {
  float angle=float(i)*2.399963;
  float radius=2.+float(i)*1.9;
  vec3 sampleColor=texture2D(scene,uv+vec2(cos(angle),sin(angle))*texel*radius).rgb;
  glow+=max(sampleColor-vec3(.45),vec3(0.));weight+=1.;
 }
 color+=glow/weight*.65;
 float vignette=1.-.23*dot(uv-.5,uv-.5);
 gl_FragColor=vec4(pow(color*vignette,vec3(.88)),1.);
}
`;
