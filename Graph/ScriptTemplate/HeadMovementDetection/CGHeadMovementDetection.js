/**
 * @file CGHeadMovementDetection.js
 * @author rcano
 * @date 2022/6/28
 * @brief CGHeadMovementDetection.js
 * @copyright Copyright (c) 2022, ByteDance Inc, All Rights Reserved
 */

const { BaseNode } = require('./BaseNode');
const Amaz = effect.Amaz;

const { BEMessage, BEState } = require('./BEMessage');
const BEMsg = BEMessage.HeadMovement;

class CGHeadMovementDetection extends BaseNode {
  constructor() {
    super();
    this._actionDetected = false;
    this._headIndexMap = {
      'Head 0': 0,
      'Head 1': 1,
      'Head 2': 2,
      'Head 3': 3,
      'Head 4': 4,
      Any: -1,
    };
    this._headMovementMap = {
      'Head Nod': Amaz.FaceAction.HEAD_PITCH,
      'Head Shake': Amaz.FaceAction.HEAD_YAW,
    };
    this.headAction = {
      'Head Nod': BEMsg.action.HeadNod.id,
      'Head Shake': BEMsg.action.HeadShake.id,
    };
    this.lastAction = BEState.None.key;
  }

  onUpdate(sys, dt) {
    if (
      this.inputs[0] === null ||
      this.inputs[0] === undefined ||
      this.inputs[1] === null ||
      this.inputs[1] === undefined
    ) {
      return;
    }

    const headKey = this.inputs[0]();
    const movementKey = this.inputs[1]();

    const algMgr = Amaz.AmazingManager.getSingleton('Algorithm');
    const algResult = algMgr.getAEAlgorithmResult();

    if (algResult === null || headKey === null || movementKey === null) {
      return;
    }

    const headVal = this._headIndexMap[headKey];
    const movementVal = this._headMovementMap[movementKey];

    if (headVal === undefined || movementVal === undefined) {
      return;
    }

    let hasAction = false;
    if (headVal === -1) {
      for (let i = 0; i < 5 && !hasAction; ++i) {
        const face = algResult.getFaceBaseInfo(i);
        if (face) {
          hasAction = face.hasAction(movementVal);
        }
      }
    } else {
      const face = algResult.getFaceBaseInfo(headVal);
      if (face) {
        hasAction = face.hasAction(movementVal);
      }
    }

    if (!this._actionDetected && hasAction) {
      if (this.nexts[0]) {
        this.nexts[0]();
      }
      if (sys.scene && this.lastAction !== BEState.Begin.key) {
        this.lastAction = BEState.Begin.key;
        sys.scene.postMessage(BEMsg.msgId, this.headAction[movementKey], BEState.Begin.id, '');
      }
    }
    if (hasAction) {
      if (this.nexts[1]) {
        this.nexts[1]();
      }
      if (sys.scene && this.lastAction !== BEState.Stay.key) {
        this.lastAction = BEState.Stay.key;
        sys.scene.postMessage(BEMsg.msgId, this.headAction[movementKey], BEState.Stay.id, '');
      }
    }
    if (this._actionDetected && !hasAction) {
      if (this.nexts[2]) {
        this.nexts[2]();
      }
      if (sys.scene && this.lastAction !== BEState.End.key) {
        this.lastAction = BEState.End.key;
        sys.scene.postMessage(BEMsg.msgId, this.headAction[movementKey], BEState.End.id, '');
      }
    }
    if (!hasAction) {
      if (this.nexts[3]) {
        this.nexts[3]();
      }
      if (sys.scene && this.lastAction !== BEState.None.key) {
        this.lastAction = BEState.None.key;
        sys.scene.postMessage(BEMsg.msgId, this.headAction[movementKey], BEState.None.id, '');
      }
    }

    this._actionDetected = hasAction;
  }
}

exports.CGHeadMovementDetection = CGHeadMovementDetection;
