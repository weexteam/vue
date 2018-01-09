/* @flow */

// this will be preserved during build
// $flow-disable-line
const transpile = require('vue-template-es2015-compiler')

import { simplePathRE, fnExpRE } from 'compiler/codegen/events'
import { functionCallRE } from 'weex/util/parser'

// Generate handler code with binding params for Weex platform
/* istanbul ignore next */
export function genWeexHandlerWithParams (params: Array<any>, handlerCode: string) {
  let innerHandlerCode = handlerCode
  const exps = params.filter(exp => simplePathRE.test(exp) && exp !== '$event')
  const bindings = exps.map(exp => ({ '@binding': exp }))
  const args = exps.map((exp, i) => {
    const key = `$_${i + 1}`
    innerHandlerCode = innerHandlerCode.replace(exp, key)
    return key
  })
  args.push('$event')
  return '{\n' +
    `handler:function(${args.join(',')}){${innerHandlerCode}},\n` +
    `params:${JSON.stringify(bindings)}\n` +
  '}'
}

export function genWeexHandler (handler: ASTElementHandler, options: CompilerOptions): string {
  let code = handler.value
  const isMethodPath = simplePathRE.test(code)
  const isFunctionExpression = fnExpRE.test(code)
  const isFunctionCall = functionCallRE.test(code)

  // TODO: binding this to recyclable event handlers
  if (options.recyclable) {
    if (isMethodPath) {
      return `function($event){this.${code}()}`
    }
    if (isFunctionExpression) {
      // TODO
    }
    if (isFunctionCall) {
      return `function($event){this.${code}}`
    }
    // inline statement
    code = transpile(`with(this){${code}}`, {
      transforms: { stripWith: true }
    })
  }

  if (isMethodPath || isFunctionExpression) {
    return code
  }
  /* istanbul ignore if */
  if (handler.params) {
    return genWeexHandlerWithParams(handler.params, handler.value)
  }
  // inline statement
  return `function($event){${code}}`
}
