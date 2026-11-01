/** Original animated silhouettes, weather and vignettes for the city scene. */
export const CITY_LIFE_SHADER = `
uniform sampler2D fox;
float segment(vec2 p,vec2 a,vec2 b) {
 vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.));
}
float shape(float d,float edge){return 1.-smoothstep(0.,edge,d);}
float dancer(vec2 p,float phase) {
 float beat=time*1.8+phase,sway=sin(beat)*.055;
 vec2 hip=vec2(sway,.42),chest=vec2(-sway*.7,.68);
 vec2 head=chest+vec2(sin(beat*.5)*.025,.13);
 float d=length((p-head)*vec2(1.,.87))-.057;
 // Hair, fitted dress, articulated arms and legs, rather than a static icon.
 d=min(d,segment(p,head+vec2(.025,.02),head+vec2(.06,-.1))-.034);
 vec2 legA=vec2(-.09+sin(beat)*.08,.04),legB=vec2(.12+cos(beat)*.05,.04);
 d=min(d,segment(p,hip+vec2(-.055,0),vec2(-.09,.23))-.028);
 d=min(d,segment(p,vec2(-.09,.23),legA)-.021);
 d=min(d,segment(p,hip+vec2(.055,0),vec2(.1+sin(beat)*.04,.24))-.028);
 d=min(d,segment(p,vec2(.1+sin(beat)*.04,.24),legB)-.021);
 float waist=abs(p.x-mix(hip.x,chest.x,clamp((p.y-.42)/.26,0.,1.)));
 float dress=max(waist-(.048+.045*abs(p.y-.56)/.16),max(.36-p.y,p.y-.7));
 d=min(d,dress);
 vec2 shoulderA=chest+vec2(-.07,0),shoulderB=chest+vec2(.07,0);
 vec2 elbowA=vec2(-.2,.7+sin(beat)*.12),elbowB=vec2(.2,.64+cos(beat)*.1);
 vec2 handA=vec2(-.14+sin(beat*.7)*.1,.92),handB=vec2(.27,.8+sin(beat+.8)*.1);
 d=min(d,segment(p,shoulderA,elbowA)-.023);d=min(d,segment(p,elbowA,handA)-.018);
 d=min(d,segment(p,shoulderB,elbowB)-.023);d=min(d,segment(p,elbowB,handB)-.018);
 d=min(d,segment(p,legA,legA+vec2(.045,-.02))-.018);
 d=min(d,segment(p,legB,legB+vec2(.045,-.02))-.018);
 return d;
}
vec3 hologram(vec3 color,vec2 uv,mat3 view,vec3 ro,vec3 center,float height,float nearest,float phase,vec3 tint) {
 vec3 relative=(center-ro)*view;
 if(relative.z<=0.)return color;
 vec2 anchor=relative.xy/relative.z*1.05;
 vec2 p=(uv-anchor)*relative.z/(height*1.05)+vec2(0,.5);
 if(abs(p.x)>.65 || p.y<-.1 || p.y>1.15 || relative.z>nearest+.5)return color;
 bool glitch=eventKind>1.5 && eventKind<2.5;
 float jitter=glitch?sin(floor(p.y*28.)+eventPhase*52.)*.025:0.;p.x+=jitter;
 float d=dancer(p,phase),alpha=shape(d,.007);
 float scan=.6+.4*sin(gl_FragCoord.y*2.+time*9.);
 if(glitch){
  vec2 tex=vec2(p.x+.5,1.-p.y);
  vec4 logo=texture2D(fox,clamp(tex,0.,1.));
  alpha=logo.a*step(0.,tex.x)*step(tex.x,1.)*step(0.,tex.y)*step(tex.y,1.);
 }
 float flicker=glitch?(.3+.7*step(.25,hash(vec2(floor(eventPhase*18.),phase)))):1.;
 float edge=exp(-abs(d)*65.)*.25;
 color=mix(color,color*.5+tint*(.25+scan*.4+exp(-abs(d)*80.)*.5)*(.75+.25*sin(p.x*40.+p.y*8.))*intensity,alpha*.7*flicker);
 color+=tint*(glitch?0.:edge)*flicker*.5;
 float platform=exp(-abs(p.y+.025)*110.)*exp(-p.x*p.x*12.);
 color+=tint*platform*.8;
 // Projector cone below the figure.
 float cone=(1.-smoothstep(.0,.38,abs(p.x)))*smoothstep(-.1,.1,p.y)*(1.-smoothstep(.0,.4,p.y));
 color+=tint*cone*.045;
 return color;
}
vec3 aircraft(vec3 color,vec2 uv,mat3 view,vec3 ro,float nearest) {
 for(int i=0;i<7;i++){
  float id=float(i),t=time*(.4+hash(vec2(id,4))*.4);
  vec3 center=vec3(mod(t*5.+id*16.,80.)-40.,7.+mod(id,3.)*3.,-3.-id*5.);
  vec3 local=(center-ro)*view;if(local.z<1.)continue;
  vec2 p=(uv-local.xy/local.z*1.05)*local.z/1.05;
  if(local.z>nearest+1.)continue;
  float body=max(abs(p.x)-.38,abs(p.y)-.07);
  float cockpit=max(abs(p.x+.04)-.19,abs(p.y-.09)-.045);
  float silhouette=shape(min(body,cockpit),.035);
  color=mix(color,vec3(.02,.034,.047),silhouette);
  color+=vec3(.04,.8,1.3)*exp(-length((p-vec2(-.27,-.09))*vec2(2,5))*12.);
  color+=vec3(1.5,.06,.2)*exp(-length((p-vec2(.34,0))*vec2(2,5))*20.);
  float exhaust=exp(-abs(p.y+.08)*45.)*exp(-max(0.,p.x-.25)*4.)*step(.25,p.x);
  color+=vec3(.05,.35,.8)*exhaust*.2;
 }
 return color;
}
vec3 balcony(vec3 color,vec2 uv) {
 vec2 p=(uv-vec2(min(.47,resolution.x/resolution.y*.30),-.51))/.58;
 // A silhouetted observer in a long coat, on the near balcony.
 float head=length((p-vec2(.02,.79))*vec2(1.,.9))-.06;
 float coat=max(abs(p.x)-(.072+(.68-p.y)*.14),max(.19-p.y,p.y-.71));
 float person=min(head,coat);
 person=min(person,length((p-vec2(-.025,.775))*vec2(1.,2.))-.06);
 person=min(person,segment(p,vec2(-.04,.23),vec2(-.055,.02))-.03);
 person=min(person,segment(p,vec2(.06,.23),vec2(.085,.02))-.03);
 vec2 hand=vec2(-.17,.66);
 person=min(person,segment(p,vec2(-.055,.67),vec2(-.13,.5))-.033);
 person=min(person,segment(p,vec2(-.13,.5),hand)-.026);
 person=min(person,segment(p,vec2(.075,.65),vec2(.12,.4))-.03);
 color=mix(color,vec3(.008,.013,.023),shape(person,.006));
 color+=vec3(.04,.22,.26)*exp(-abs(person)*200.)*.18;
 float lapel=segment(p,vec2(-.055,.7),vec2(.0,.53));
 color+=vec3(.07,.17,.2)*exp(-lapel*240.)*.5;
 color+=vec3(.06,.11,.13)*exp(-abs(p.y-.37)*400.)*step(abs(p.x),.09);
 float dropped=eventKind>3.5&&eventKind<4.5?min(eventPhase,2.):0.;
 vec2 cigarette=hand+vec2(-.025,-dropped*dropped*.16);
 float ember=length(p-cigarette);
 color+=vec3(2.,.21,.025)*exp(-ember*160.);
 float paper=segment(p,cigarette,cigarette+vec2(.036,.005))-.005;
 color=mix(color,vec3(.5,.47,.38),shape(paper,.003));
 if(dropped<.01){
  float smokeY=p.y-.68;
  float smokeX=p.x+.19-sin(smokeY*15.-time*.8)*.025;
  float smoke=exp(-smokeX*smokeX/(.00006+max(0.,smokeY)*.006))*smoothstep(0.,.12,smokeY)*(1.-smoothstep(.15,.65,smokeY));
  color+=vec3(.22,.3,.34)*smoke*.28;
 }
 // Weathered railing catches cyan and magenta light.
 float rail=abs(uv.y+.31);
 float post=abs(fract((uv.x+.1)*5.)-.5);
 float mask=max(step(rail,.009),step(post,.018)*step(uv.y,-.31));
 color=mix(color,vec3(.016,.026,.036),mask);
 color+=vec3(.06,.27,.3)*exp(-abs(uv.y+.3)*650.)*.4;
 color=mix(color,vec3(.009,.015,.023),step(uv.y,-.47));
 if(eventKind>.5 && eventKind<1.5){
  float x=-.8+eventPhase*.36;
  vec2 q=(uv-vec2(x,-.452))*12.;
  float cat=length((q-vec2(0,.13))*vec2(.65,1.4))-.12;
  cat=min(cat,length(q-vec2(.17,.23))-.075);
  cat=min(cat,segment(q,vec2(.12,.27),vec2(.11,.35))-.023);
  cat=min(cat,segment(q,vec2(.19,.27),vec2(.21,.34))-.023);
  cat=min(cat,segment(q,vec2(-.16,.15),vec2(-.28,.29+sin(time*7.)*.04))-.025);
  for(int j=0;j<4;j++){float k=float(j);cat=min(cat,segment(q,vec2(-.1+k*.07,.1),vec2(-.13+k*.09+sin(time*14.+k*PI)*.05,0))-.016);}
  color=mix(color,vec3(.12,.14,.15),shape(cat,.025));
  color+=vec3(.2,.65,.3)*exp(-length(q-vec2(.21,.24))*110.);
 }
 return color;
}
vec3 cityWeather(vec3 color,vec2 uv,vec3 rd,float nearest) {
 // Layered oblique rain: near streaks, fine distant rain and lens droplets.
 for(int i=0;i<3;i++){
  float layer=float(i),scale=90.+layer*65.;
  vec2 p=uv*vec2(scale,scale*.18);
  p.x+=p.y*.17;p.y+=time*(9.+layer*4.);
  vec2 id=floor(p),f=fract(p);
  float rain=exp(-abs(f.x-.5)*150.)*pow(max(0.,sin(f.y*PI)),4.)*step(.78,hash(id));
  color+=vec3(.3,.5,.64)*rain*(.5+layer*.12);
 }
 float mist=fbm(vec2(uv.x*6.+time*.03,uv.y*5.));
 color+=vec3(.03,.09,.13)*mist*.12;
 if(eventKind>2.5&&eventKind<3.5){
  for(int i=0;i<6;i++){
   float id=float(i);vec2 q=uv-vec2(-.8+eventPhase*.32-id*.03,.27+sin(id)*.035);
   float wings=abs(q.y-abs(q.x)*(.5+sin(time*12.+id)*.65));
   float bird=exp(-wings*950.)*(1.-smoothstep(.005,.019,abs(q.x)));
   color=mix(color,vec3(.007,.01,.02),bird*.9);
  }
 }
 if(eventKind>4.5 && nearest>50.){
  vec2 q=uv-vec2(-.6+eventPhase*.26,.43-eventPhase*.10);
  float along=dot(q,normalize(vec2(.26,-.1))),across=abs(dot(q,normalize(vec2(.1,.26))));
  color+=vec3(.5,.75,1.)*exp(-across*1200.)*smoothstep(-.16,0.,along)*(1.-step(0.,along))*sin(clamp(eventPhase/5.,0.,1.)*PI);
 }
 return color;
}
`;
