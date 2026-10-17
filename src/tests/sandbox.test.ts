import { describe, expect, it } from 'vitest'
import { getQuickJS } from 'quickjs-emscripten'

async function evaluate(code:string){const QuickJS=await getQuickJS();const vm=QuickJS.newContext();try{const result=vm.evalCode(`${code}\nJSON.stringify({crystalPower,gateUnlocked})`);if(result.error){result.error.dispose();return null}const value=JSON.parse(String(vm.dump(result.value))) as {crystalPower:number;gateUnlocked:boolean};result.value.dispose();return value}finally{vm.dispose()}}
describe('crystal challenge sandbox',()=>{
  it('accepts the intended JavaScript result',async()=>{await expect(evaluate('const crystalPower=100; const gateUnlocked=true;')).resolves.toEqual({crystalPower:100,gateUnlocked:true})})
  it('does not confuse strings with semantic values',async()=>{await expect(evaluate("const crystalPower='100'; const gateUnlocked='true';")).resolves.not.toEqual({crystalPower:100,gateUnlocked:true})})
})
