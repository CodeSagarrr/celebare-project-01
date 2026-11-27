import { dkimSign } from "mailauth/lib/dkim/sign";

const demoPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6hP9E5G4VYpp7\ngfJtSpZh/kEpSLy7rkIXLpynbZWOCM2WvBpHv0iySU8yk/CkgWpvPnGVGGqZjLkb\nyypriOFs2wsBUZsNwfcZRCLxMcQ8VNMIHB2AKVdwU5YGgYvL6OpaYOupNI2tkJED\nzIJDNtjMx3ZgOVptwkBg+dHsJFmAdMpIPKakQRda6DCC7BLNH4hJJ1rpaMU6MCXm\n6F/sCpjgCSqWv/AA07ESYAUoPQkpd4aTkS6Forj+OYtZwbZpVlpUUx130zTc2UUS\n7bEMI6ngJfXAQgN34MAXOnHpIIngfjbLO/fppwi/SDgulBzV95wan/2Rw9fuUlwl\nPJQwixVbAgMBAAECggEAQtyMOWD9iVL4d8/EXKNBN02ShD8b0NeNv4upAmfJFcpY\nEHHLpe6PG8Ilzsazm/T8d3ZV9xFynSqR7MGuqi++R2xaDJX5VDw03OzM7dNeOhZa\nM+0IMjofqxd7j0d/GpCa+d0GfXhmVVKeeVMlWvzdSMMzzxigLvpUY68KLnF1WBNo\n5MpZZCJPNjNEKoJ4TesMNECApmlVR6/qRkfGklJOvqb7Qpbvd2oVUtUcOrmeLgRu\nVJn1T0BjNkW+AhByxPaN1C3+ltDO5mZ2o6wEYyEkQ8Yt3tuLZTK4u9eIWh59NSqY\nle30DGmEFQ/yf5iehHBK/f2BvK9jUMrVWs3gh/NUCQKBgQDkG7kBOJerQQq3XxDm\nSBDJwQ10oPFJKe/17tHKr34/H7LMz6Jnj1GqOOnqutJZ3PjbZpZ/WfbV+WiK1als\nu1pjEoUBT7+OW33E1fbRgEP0jLKrXNGpTEUZ4LKJgI8d8oKhhKTOcMeeZeL9i4z1\nsVmUZhOPqaap6CY3Vtkm+WYEVwKBgQDRU3T85/zEw2SwOeTBGCDzm2RN7JASQTVN\nRMTWF/U4padoQR1Qfr3ad6sM5/x/KRLGaBdxKkepzZdz3066+EaJDJCh5VRC0Ysh\ndKxAOMTEV7/xZ3zsqOCHce1B6H+7gJST6GzAbCOXekrwkJ8yEmvuugCgI57R20JL\npYXKqzV0nQKBgQCwg+tj0IE9WnWKdJxFNtsW5Lce2zQb48H207mwWKEfA85+wuXv\nsW4GhUguBiektmQ0k2w+XEWwSvHlDXWv2EMXi0s1OpsG9DGc0d3PPKxZX08bYBY2\nJfkLD1/ZG4ykJfeEOXq27XrrTfibLxQDRBwHw/27HBMGQ8je5evgRvn0vQKBgCvl\nM2Ahicj9LG0kBstTMv3CtTr+A4xAblwAssIujfbODhf3p50MpuVcONtg/nrv8wb2\nJwxNEHAUM9FRn6HnlGsC3oWEoLHOXT2ryL9C6EhAGnkV+YVrOIJOqrEqfzajlQSb\nNcr4IlKOi4581VVbtZR/Hsh2D8T0FKfmUvMYCgKlAoGAR3d5vU+nYrYqB/bJg1Kd\nhiFyQzj03heNqmP2latkrkqhlcDAKV/5lyxo9qh2RKR96oRADm564wUt8jVmAmPi\nl7J2dwF/gF7+qbPspeASiqZFNr85Jrn1Av4qPDQUbrQ3WqLQYAVJTLEZgsCB9Q6g\nN+CB5ZcS+NoXNKz78kjsckA=\n-----END PRIVATE KEY-----\n";

export type DemoBank = "a" | "b";

export async function makeDemoEmail(input: {
  from: string;
  inboxAddress: string;
  receiverUpiId: string;
  bank: DemoBank;
  amountPaise: number;
  utr: string;
  txnTime: Date;
  signed: boolean;
}) {
  const amount = `${Math.floor(input.amountPaise / 100)}.${String(input.amountPaise % 100).padStart(2, "0")}`;
  const body = input.bank === "a"
    ? `Payment credited\nAmount: INR ${amount}\nUTR: ${input.utr}\nTransaction time: ${input.txnTime.toISOString()}\nTo: ${input.receiverUpiId}\nStatus: CREDITED`
    : `amount=${amount}; utr=${input.utr}; time=${input.txnTime.toISOString()}; to=${input.receiverUpiId}; result=credited`;
  const raw = [
    `From: Demo bank <${input.from}>`, `To: ${input.inboxAddress}`,
    "Subject: Demo bank credit notice", `Date: ${input.txnTime.toUTCString()}`,
    "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", body, "",
  ].join("\r\n");
  if (!input.signed) return raw;
  const domain = input.bank === "a" ? "bank-a.example.test" : "bank-b.example.test";
  const result = await dkimSign(raw, {
    signatureData: [{ signingDomain: domain, selector: "demo", privateKey: demoPrivateKey }],
  });
  if (!result.signatures) {
    const codes = result.errors.map((error) => error.err.code ?? "UNKNOWN").join(", ");
    throw new Error("Could not sign demo bank email" + (codes ? " (" + codes + ")" : ""));
  }
  return result.signatures + raw;
}
