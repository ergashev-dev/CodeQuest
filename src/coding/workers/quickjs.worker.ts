import { getQuickJS } from 'quickjs-emscripten'

interface Request { code:string }
self.onmessage=async(event:MessageEvent<Request>)=>{
  const QuickJS=await getQuickJS();const vm=QuickJS.newContext()
  try{
    const wrapped=`${event.data.code}\nJSON.stringify({ crystalPower: typeof crystalPower === 'undefined' ? null : crystalPower, gateUnlocked: typeof gateUnlocked === 'undefined' ? null : gateUnlocked });`
    const result=vm.evalCode(wrapped)
    if(result.error){const error=vm.dump(result.error);result.error.dispose();self.postMessage({ok:false,error:String(error)})}
    else{const json=vm.dump(result.value);result.value.dispose();const value=JSON.parse(String(json)) as {crystalPower:unknown;gateUnlocked:unknown};self.postMessage(value.crystalPower===100&&value.gateUnlocked===true?{ok:true,value}:{ok:false,error:'Sinov o‘tmadi: crystalPower 100 va gateUnlocked true bo‘lishi kerak.'})}
  }catch(error){self.postMessage({ok:false,error:error instanceof Error?error.message:'Noma’lum bajarish xatosi'})}finally{vm.dispose()}
}
