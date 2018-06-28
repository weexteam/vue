/* @flow */

import { addAttr } from 'compiler/helpers'

export function postTransformRef (el: ASTElement, options: WeexCompilerOptions) {
  if (el.ref) {
    addAttr(el, 'ref', el.ref)
  }
}
