import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLocalPlayer, useWorld, useChatManager, useLoreAI, useLoreAIScene, useNpcManager, useScene, usePhysics, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

export default e => {
  const app = useApp();
  const scene = useScene();
  const npcManager = useNpcManager();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  const chatManager = useChatManager();
  const world = useWorld();
  const loreAI = useLoreAI();
  const loreAIScene = useLoreAIScene();

  const npcName = app.getComponent('name') ?? 'Anon';
  const npcVoice = app.getComponent('voice') ?? '1jLX0Py6j8uY93Fjf2l0HOZQYXiShfWUO'; // Sweetie Belle
  const npcBio = app.getComponent('bio') ?? 'A generic avatar.';
  const npcAvatarUrl = app.getComponent('avatarUrl') ?? `/avatars/drake_hacker_v3_vian.vrm`;

  const localPlayerName = `Ann`;
  // const npcName = `Scillia`;
  const npcNameLowerCase = npcName.toLowerCase();
  const localPlayerBio = `\
Nickname ANN. 13/F witch. Best friend of Scillia. She creates all of Scillia's potions. She is shy and keeps to herself but she is a powerful witch.
`;
  /* const npcBio = `\
`; */
  // const npcVoice = `1PUUS71w2ik0uuycNB30nXFze8C7O8OzY`; // Shining Armor
  // const npcVoice = `1a3CYt0-oTTSFjxtZvAVMpClTmQteYua5`; // Trixie
  // const npcVoice = `1jLX0Py6j8uY93Fjf2l0HOZQYXiShfWUO`; // Sweetie Belle

  let live = true;
  const subApps = [];
  let npcPlayer = null;
  e.waitUntil((async () => {
    // const u2 = `${baseUrl}tsumugi-taka.vrm`;
    // const u2 = `${baseUrl}rabbit.vrm`;
    // const u2 = `/avatars/drake_hacker_v3_vian.vrm`;
    // const u2 = `/avatars/ANIME_GIRL_VRM-3.vrm`;
    // const u2 = `/avatars/scillia_drophunter_v15_vian.vrm`;
    const u2 = npcAvatarUrl;
    const m = await metaversefile.import(u2);
    if (!live) return;
    const vrmApp = metaversefile.createApp({
      name: u2,
    });

    vrmApp.position.copy(app.position);
    vrmApp.quaternion.copy(app.quaternion);
    vrmApp.scale.copy(app.scale);
    vrmApp.updateMatrixWorld();
    vrmApp.name = 'npc';
    vrmApp.setComponent('physics', true);
    vrmApp.setComponent('activate', true);
    await vrmApp.addModule(m);
    if (!live) return;
    subApps.push(vrmApp);

    const position = app.position.clone()
      .add(new THREE.Vector3(0, 1, 0));
    const {quaternion, scale} = app;
    const newNpcPlayer = await npcManager.createNpc({
      name: npcName,
      avatarApp: vrmApp,
      position,
      quaternion,
      scale,
    });
    if (!live) return;
    newNpcPlayer.position.y = newNpcPlayer.avatar.height;
    newNpcPlayer.updateMatrixWorld();
    newNpcPlayer.setVoice(npcVoice);

    scene.add(vrmApp);
    
    npcPlayer = newNpcPlayer;
  })());

  app.getPhysicsObjects = () => {
    const result = [];
    if (npcPlayer) {
      result.push(npcPlayer.physicsObject);
    }
    return result;
  };

  let target = null;
  useActivate(() => {
    // console.log('activate npc');
    if (!target) {
      target = localPlayer;
    } else {
      target = null;
    }
  });

  /* console.log('got deets', {
    npcName,
    npcVoice,
    npcBio,
    npcAvatarUrl,
  }); */

  const character = loreAIScene.addCharacter({
    name: npcName,
    bio: npcBio,
  });

  const slowdownFactor = 0.4;
  const walkSpeed = 0.075 * slowdownFactor;
  const runSpeed = walkSpeed * 8;
  const speedDistanceRate = 0.07;
  useFrame(({timestamp, timeDiff}) => {
    if (npcPlayer && physics.getPhysicsEnabled()) {
      if (target) {
        const v = localVector.setFromMatrixPosition(target.matrixWorld)
          .sub(npcPlayer.position);
        v.y = 0;
        const distance = v.length();
        const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
        v.normalize()
          .multiplyScalar(speed * timeDiff);
        npcPlayer.characterPhysics.applyWasd(v);
      } /* else {
        const v = localVector.set(-1, 0, 0)
          .multiplyScalar(walkSpeed * timeDiff);
        npcPlayer.characterPhysics.applyWasd(v);
      } */

      npcPlayer.eyeballTarget.copy(localPlayer.position);
      npcPlayer.eyeballTargetEnabled = true;

      npcPlayer.updatePhysics(timestamp, timeDiff);
      npcPlayer.updateAvatar(timestamp, timeDiff);
    }
  });

  useCleanup(() => {
    live = false;

    for (const subApp of subApps) {
      scene.remove(subApp);
    }

    if (npcPlayer) {
      npcPlayer.destroy();
    }

    loreAiScene.removeCharacter(character);
  });

  return app;
};
