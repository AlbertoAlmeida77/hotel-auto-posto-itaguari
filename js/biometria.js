const CHAVE_CREDENCIAL = 'villareal_biometria_id';

function webAuthnDisponivel() {
  return window.PublicKeyCredential !== undefined;
}

async function biometriaDisponivel() {
  if (!webAuthnDisponivel()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function registrarBiometria() {
  if (!webAuthnDisponivel()) throw new Error('Seu navegador não suporta biometria WebAuthn.');

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));

  const opcoesCriacao = {
    publicKey: {
      challenge,
      rp: { name: 'Hotel Auto Posto Itaguari' },
      user: {
        id:          new Uint8Array(16),
        name:        'admin@postoitaguari.com',
        displayName: 'Administrador Hotel Auto Posto Itaguari'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7   },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000
    }
  };

  const credencial   = await navigator.credentials.create(opcoesCriacao);
  const idCredencial = bufferParaBase64(credencial.rawId);
  localStorage.setItem(CHAVE_CREDENCIAL, idCredencial);
  localStorage.setItem('villareal_biometria_registrada', 'true');
  return true;
}

async function autenticarComBiometria() {
  if (!webAuthnDisponivel()) throw new Error('Seu navegador não suporta biometria WebAuthn.');

  const idSalvo = localStorage.getItem(CHAVE_CREDENCIAL);
  if (!idSalvo) throw new Error('Nenhuma biometria registrada neste dispositivo.');

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));

  const opcoesAutenticacao = {
    publicKey: {
      challenge,
      allowCredentials: [{ id: base64ParaUint8Array(idSalvo), type: 'public-key', transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000
    }
  };

  const afirmacao = await navigator.credentials.get(opcoesAutenticacao);
  if (!afirmacao) throw new Error('Autenticação biométrica falhou.');
  return true;
}

function bufferParaBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chars = Array.from(bytes, function (b) { return String.fromCharCode(b); });
  return btoa(chars.join(''));
}

function base64ParaUint8Array(base64) {
  const binStr = atob(base64);
  const bytes  = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

async function verificarBiometria() {
  const jaRegistrada = localStorage.getItem('villareal_biometria_registrada') === 'true';
  return jaRegistrada ? await autenticarComBiometria() : await registrarBiometria();
}
