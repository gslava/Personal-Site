/** Geographic maps are local. Orbits and distant celestial bodies are artistic. */
export const EARTH_SHADER = `
uniform sampler2D earthDay;
uniform sampler2D earthNight;
uniform sampler2D earthClouds;
uniform float satelliteCount;
uniform float orbitalDistance;
float sphereHit(vec3 ro,vec3 rd,vec3 center,float radius) {
 vec3 q=ro-center;float b=dot(q,rd),c=dot(q,q)-radius*radius,h=b*b-c;
 return h<0. ? 10000. : (-b-sqrt(h)>0. ? -b-sqrt(h) : 10000.);
}
float cubeHit(vec3 ro,vec3 rd,vec3 extent) {
 vec3 inv=sign(rd)/max(abs(rd),vec3(.00001));
 vec3 a=(-extent-ro)*inv,b=(extent-ro)*inv;
 vec3 lo=min(a,b),hi=max(a,b);
 float near=max(max(lo.x,lo.y),lo.z),far=min(min(hi.x,hi.y),hi.z);
 return far>max(near,0.) ? max(near,0.) : 10000.;
}
vec2 mapUV(vec3 n,float spin) {
 return vec2(fract(.5-atan(n.z,n.x)/(2.*PI)+spin),.5-asin(clamp(n.y,-1.,1.))/PI);
}
vec3 universe(vec3 rd) {
 vec2 uv=vec2(atan(-rd.x,-rd.z),asin(clamp(rd.y,-1.,1.)));
 float cloud=fbm(uv*5.+vec2(7,3));
 float dust=fbm(uv*18.);
 float band=exp(-pow((uv.y-.35*uv.x-.1)*5.,2.));
 vec3 col=vec3(.001,.002,.008)+mix(vec3(.014,.022,.07),vec3(.13,.028,.08),cloud)*band*pow(cloud,2.)*2.;
 col+=vec3(.055,.08,.12)*band*dust*.5;
 col+=stars(rd)*1.4;
 // A resolved spiral galaxy behind the orbital plane.
 vec2 g=rot(.45)*(uv-vec2(.48,.03));g.y*=2.8;
 float radius=length(g),angle=atan(g.y,g.x);
 float grain=fbm(g*95.);
 float arms=pow(.5+.5*sin(angle*2.+log(radius+.004)*5.+(grain-.5)*1.6),5.);
 arms*=.3+grain*1.5;
 float specks=pow(hash(floor(g*1800.)),32.)*exp(-radius*14.);
 col+=vec3(.35,.42,.58)*specks*(arms+.1)*.35;
 col+=mix(vec3(.08,.19,.36),vec3(.68,.48,.3),exp(-radius*20.))*(arms*1.8+.25)*exp(-radius*10.);
 col+=vec3(.85,.65,.43)*exp(-radius*80.)*.8;
 // Distant ringed planet; deliberately composed, not astronomical scale.
 vec3 center=normalize(vec3(.4,.0,-1.));
 vec3 right=normalize(cross(vec3(0,1,0),center)),up=cross(center,right);
 vec2 q=vec2(dot(rd,right),dot(rd,up));
 q=rot(-.32)*q;
 float disk=length(q),r=.046;
 float ring=length(vec2(q.x,q.y*3.3));
 if(dot(rd,center)>.98 && ring>.059 && ring<.105) {
  float gaps=.45+.3*sin(ring*1500.);
  col+=vec3(.36,.25,.14)*gaps*(.45+.5*(1.-smoothstep(.06,.105,ring)));
 }
 if(dot(rd,center)>.98 && disk<r){
  vec3 n=normalize(vec3(q,sqrt(r*r-disk*disk)));
  float bands=.6+.14*sin(q.y*750.+noise(q*150.)*2.);
  col=vec3(.53,.34,.17)*bands*(.12+max(0.,dot(n,normalize(vec3(-1,1,2)))));
 }
 // Small cool planet at the opposite edge of the star field.
 vec3 iceDir=normalize(vec3(-.8,-.25,-1.));float ice=length(rd-iceDir);
 if(ice<.024)col=vec3(.055,.2,.35)*sqrt(max(0.,1.-ice*ice/(.024*.024)));
 float phase=mod(time,17.);
 if(phase<1.6){
  vec2 head=vec2(-.42+phase*.45,.06-phase*.18);
  vec2 d=uv-head;vec2 axis=normalize(vec2(.45,-.18));
  float along=dot(d,axis),across=abs(dot(d,vec2(-axis.y,axis.x)));
  col+=vec3(.45,.7,1.)*exp(-across*1600.)*smoothstep(-.3,0.,along)*(1.-step(0.,along))*sin(phase/1.6*PI);
 }
 return col;
}
void main() {
 vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 uv*=max(1.,resolution.y/resolution.x*1.35);
 float angle=pointer.x*2.8+.1,elevation=.22+pointer.y*.9;
 if(camera>.5 && camera<1.5)angle+=2.4;
 if(camera>1.5)elevation=1.22+pointer.y*.25;
 float distance=8.3+orbitalDistance*.8;
 vec3 ro=vec3(sin(angle)*cos(elevation),sin(elevation),cos(angle)*cos(elevation))*distance;
 vec3 rd=lookAt(ro,vec3(0))*normalize(vec3(uv,1.4));
 vec3 sunlight=normalize(vec3(-4,2.3,4));
 vec3 col=universe(rd);
 float nearest=sphereHit(ro,rd,vec3(0),1.75);
 if(nearest<9999.) {
  vec3 p=ro+rd*nearest,n=normalize(p);
  vec2 st=mapUV(n,time*.005+.23);
  vec3 day=texture2D(earthDay,st).rgb;
  vec3 night=texture2D(earthNight,st).rgb;
  float cloud=texture2D(earthClouds,mapUV(n,time*.0056+.23)).r;
  float sun=dot(n,sunlight),diffuse=max(0.,sun);
  float ocean=smoothstep(day.r*1.15,day.r*1.15+.06,day.b)*(1.-cloud);
  vec3 halfVector=normalize(sunlight-rd);
  float spec=pow(max(0.,dot(n,halfVector)),65.)*ocean;
  col=day*(.045+diffuse*1.45);
  col+=night*vec3(1.5,1.04,.58)*(1.-smoothstep(-.25,.1,sun))*1.8;
  col=mix(col,vec3(.92,.97,1.)*(.08+diffuse*1.15),smoothstep(.12,.85,cloud)*.92);
  col+=vec3(.55,.7,.9)*spec*.65;
  float rim=pow(1.-max(0.,dot(n,-rd)),3.5);
  col+=vec3(.035,.24,.65)*rim*(.3+max(0.,sun))*1.5;
 }
 // Thin, sunlit atmospheric limb outside the geographic surface.
 float closest=length(cross(ro,rd));
 if(dot(ro,rd)<0. && closest>1.745){
  float limb=exp(-(closest-1.75)*38.);
  col+=vec3(.035,.3,1.)*limb*.48*max(.12,dot(normalize(ro+rd*max(0.,-dot(ro,rd))),sunlight));
 }
 vec3 moonCenter=vec3(-4.5,2.5,-5.5);
 float moon=sphereHit(ro,rd,moonCenter,.53);
 if(moon<nearest){
  nearest=moon;vec3 n=normalize(ro+rd*moon-moonCenter);
  float craters=fbm(mapUV(n,0.)*55.);
  col=vec3(.48,.46,.43)*(.4+craters*.7)*(.055+max(0.,dot(n,sunlight)));
 }
 for(int i=0;i<32;i++) {
  if(float(i)>=satelliteCount)break;
  float id=float(i),seed=hash(vec2(id,7));
  float radius=1.75*(1.+orbitalDistance)*(1.+mod(id,3.)*.045);
  float phase=id*2.39996+time*.32/pow(radius/2.,1.5);
  float inclination=.25+seed*2.4;
  vec3 center=vec3(cos(phase),0,sin(phase))*radius;
  center.yz=rot(inclination)*center.yz;
  mat3 basis=mat3(vec3(cos(phase),0,sin(phase)),vec3(0,1,0),vec3(-sin(phase),0,cos(phase)));
  vec3 localRo=ro-center,localRd=rd;
  localRo.yz=rot(-inclination)*localRo.yz;localRd.yz=rot(-inclination)*localRd.yz;
  localRo=localRo*basis;localRd=localRd*basis;
  float type=mod(id,3.);
  float body=cubeHit(localRo,localRd,type<.5?vec3(.055,.075,.055):vec3(.065,.12,.065));
  float dish=10000.;
  if(type>.5 && type<1.5) dish=sphereHit(localRo,localRd,vec3(0,.17,0),.083);
  if(type>1.5) body=min(body,cubeHit(localRo-vec3(0,.03,.1),localRd,vec3(.035,.035,.11)));
  float wingSize=.18+mod(id,3.)*.045;
  float wings=cubeHit(localRo-vec3(wingSize+.075,0,0),localRd,vec3(wingSize,.009,.085));
  wings=min(wings,cubeHit(localRo+vec3(wingSize+.075,0,0),localRd,vec3(wingSize,.009,.085)));
  float antenna=cubeHit(localRo-vec3(0,.11,0),localRd,vec3(.008,.06,.008));
  float hit=min(dish,min(body,min(wings,antenna)));
  if(hit<nearest){
   nearest=hit;vec3 p=localRo+localRd*hit;
   float lit=.35+.65*max(0.,dot(normalize(center),sunlight));
   col=vec3(.63,.51,.28)*lit;
   if(hit==wings){
    float grid=step(.09,fract(p.x*75.))*step(.10,fract(p.z*75.));
    col=mix(vec3(.26,.3,.36),vec3(.012,.055,.18),grid)*lit;
    col+=vec3(.1,.3,.65)*pow(abs(localRd.y),12.)*.5;
   } else {
    col+=vec3(.42,.48,.57)*max(0.,-localRd.z);
    if(abs(p.y)<.013)col+=vec3(.03,.4,.9)*.4;
    if(hit==dish){vec3 n=normalize(p-vec3(0,.17,0));col=vec3(.7,.74,.78)*(.3+.7*abs(dot(n,localRd)));}
   }
  }
 }
 gl_FragColor=expose(col*1.25);
}
`;
