const Wallet = require('./Wallet');

const mnemonic = 'iron veteran acid police high action carry nothing wet grow major joke rifle need roof found wolf unit acid open bleak rifle method drink';
const invalidMnemonicChecksum = 'iron veteran police acid high action carry nothing wet grow major joke rifle need roof found wolf unit acid open bleak rifle method drink';
const invalidMnemonicWordlist = 'invalid iron veteran acid police high action carry nothing wet grow major joke rifle need roof found wolf unit acid open bleak rifle method drink';
const pubKey = '02868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e';
const privateKey = '86e811135fddc71d23595d12ae83c42ccac02daa8a36ffa30049d839a605eabc';
const address = 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah';

describe('Keys generation', () => {
    const validateKeys = w => {
        test('private key', () => {
            expect(w.privateKey.toString()).toEqual(privateKey);
        });

        test('public key', () => {
            expect(w.publicKey.toString()).toEqual(pubKey);
        });

        test('address', () => {
            expect(w.address).toEqual(address);
        });
    };

    describe('Mnemonic produce valid keys', () => {
        validateKeys(new Wallet(mnemonic));
    });

    describe('Private keys hex produce valid keys', () => {
        validateKeys(new Wallet(null, privateKey));
    });

    test('Invalid mnemonic wordlist throws error', () => {
        expect(() => {
            // eslint-disable-next-line no-new
            new Wallet(invalidMnemonicWordlist);
        }).toThrow();
    });

    test('Invalid mnemonic checksum throws error', () => {
        expect(() => {
            // eslint-disable-next-line no-new
            new Wallet(invalidMnemonicChecksum);
        }).toThrow();
    });

    test('Invalid key hex throws error', () => {
        expect(() => {
            // eslint-disable-next-line no-new
            new Wallet(null, 'errorkey');
        }).toThrow();
    });

    test('Empty mnemonic and key throws error', () => {
        expect(() => {
            // eslint-disable-next-line no-new
            new Wallet();
        }).toThrow();
    });
});

describe('JSON canonization', () => {
    const canonicalJSON = '[{"alpha":"test","beta":{"alpha":"test","beta":"test"},"gamma":"test"}]';
    const nonCanonicalJSON = '[{"beta":{"alpha":"test","beta":"test"},"alpha":"test","gamma":"test"}]';

    test('Canonical JSON didn\'t changes', () => {
        expect(JSON.stringify(Wallet.toCanonicalJSON(JSON.parse(canonicalJSON)))).toEqual(canonicalJSON);
    });

    test('Recursive canonization', () => {
        expect(JSON.stringify(Wallet.toCanonicalJSON(JSON.parse(nonCanonicalJSON)))).toEqual(canonicalJSON);
        expect(JSON.stringify(Wallet.toCanonicalJSON(JSON.parse(nonCanonicalJSON)))).not.toEqual(nonCanonicalJSON);
    });
});

describe('Signing', () => {
    const testJson = {data: 'some test data', deep: {data: 'more test data'}};
    const testJsonOtherOrder = {deep: {data: 'more test data'}, data: 'some test data'};
    const otherTestJson = {data: 'some another test data', deep: {data: 'more test data'}};
    const signature = '7f5801be11f35ff7531dd2e56546ad7376fe1600926ad03be833a40dd8a234877b4c267e0d939f88f9adf605c34fccc1d7a7aa9947820ac900fae6a2dd559927';
    const invalidSignature = '7f5801b213f5eef7531dd2e56546ad7376fe1600926ad03be833a40dd8a234877b4c267e0d939f88f9adf605c34fccc1d7a7aa9947820ac900fae6a2dd559927';
    const bytes = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const bytesSign = '3e7e0656b7eea4014711272cb56d22e4f88981ade94e9aec0870293104ddb7ba187e8a00ef7ac3e8c9df61e25f8476e15d46498cbe2ed430db26548a55a152fa';
    const incorrectBytesSign = '3e730656b7eea4014711272cb56d22e4f88981ade94e9aec0870293104ddb7ba187e8a00ef7ac3e8c9df61e25f8476e15d46498cbe2ed430db26548a55a152fa';

    const w = new Wallet(mnemonic);

    test('RAW bytes signs correctly', () => {
        expect(w.signRawBytes(bytes).toString('hex')).toEqual(bytesSign);
    });

    test('RAW bytes verifies correctly', () => {
        expect(w.verifyRawBytesSignature(bytes, Buffer.from(bytesSign, 'hex'))).toBeTruthy();
    });

    test('RAW bytes verifies correctly (invalid sign)', () => {
        expect(w.verifyRawBytesSignature(bytes, Buffer.from(incorrectBytesSign, 'hex'))).toBeFalsy();
    });

    test('JSON signs correctly', () => {
        expect(w.signJsonSync(testJson).toString('hex')).toEqual(signature);
    });

    test('JSON signs correctly (async)', async () => {
        let result = (await w.signJson(testJson)).toString('hex');
        expect(result).toEqual(signature);
    });

    test('JSON key order doesn\'t matter', () => {
        expect(w.signJsonSync(testJsonOtherOrder).toString('hex')).toEqual(signature);
    });

    test('Different JSON gives different signatures', () => {
        expect(w.signJsonSync(otherTestJson).toString('hex')).not.toEqual(signature);
    });

    describe('Signature verification', () => {

        test('correct sign', () => {
            expect(w.verifyJsonSync(testJson, Buffer.from(signature, 'hex'))).toBeTruthy();
        });

        test('correct sign, async', async () => {
            expect(await w.verifyJson(testJson, Buffer.from(signature, 'hex'))).toBeTruthy();
        });

        test('incorrect sign', () => {
            expect(w.verifyJsonSync(testJson, Buffer.from(invalidSignature, 'hex'))).toBeFalsy();
        });
    });
});

describe('Transactions generation', () => {
    const recipient = 'artr1kyarj7qyf4majaclkny90uwcnmld53u46c5n0t';

    test('Get correct signer info', () => {
        const w = new Wallet(mnemonic);
        w.setChainId('test');
        w.setAccNo(1);
        w.setSequence(2);

        expect(w._getSigner()).toEqual({
            accNo: '1',
            seqNo: '2',
            chainId: 'test',
            privKey: w.privateKey
        });
    });

    test('TX respects chain id', () => {
        const w = new Wallet(mnemonic);
        w.setChainId('test');
        expect(w.send(recipient, 1000000).toString('base64'))
            .toEqual('Co4BCosBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxa3lhcmo3cXlmNG1hamFjbGtueTkwdXdjbm1sZDUzdTQ2YzVuMHQaDwoFdWFydHISBmFtb3VudBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1'
                + 'NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYABIFEMCWsQIaQMgWOoPwC51Zk+fwOtpDBj/Ni9IeetdUygOhYMwV9ITDDOwjfRg3Eqq+tYPHFchfX3g7XhlsBt/DmkhHBRw0YaM=');
    });

    test('TX respects account number', () => {
        const w = new Wallet(mnemonic);
        w.setAccNo(10);
        expect(w.send(recipient, 1000000).toString('base64'))
            .toEqual('Co4BCosBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxa3lhcmo3cXlmNG1hamFjbGtueTkwdXdjbm1sZDUzdTQ2YzVuMHQaDwoFdWFydHISBmFtb3VudBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1'
                + 'NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYABIFEMCWsQIaQGLDvEtP6wnSlOy7x73l6nFsT3+f/tMMG1Nj1U6bRnY9HjioV6O4LJongFkBZ27+fN6SdK7gv4/mObNF/2Rg3ig=');
    });

    test('TX respects sequence number', () => {
        const w = new Wallet(mnemonic);
        w.setSequence(10);
        expect(w.send(recipient, 1000000).toString('base64'))
            .toEqual('Co4BCosBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxa3lhcmo3cXlmNG1hamFjbGtueTkwdXdjbm1sZDUzdTQ2YzVuMHQaDwoFdWFydHISBmFtb3VudBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1'
                + 'NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYChIFEMCWsQIaQJwp1a7VIsQrxHv0rkLeRUHSwUu2WjJvh2DpAXkXfRj7VJjfrgSLx6LzLYPA6wv1tZhyhuCBEXDpAac1cof5eVw=');
    });

    const w = new Wallet(mnemonic);

    test('send TX valid', () => {
        expect(w.send(recipient, 1000000).toString('base64'))
            .toEqual('Co4BCosBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxa3lhcmo3cXlmNG1hamFjbGtueTkwdXdjbm1sZDUzdTQ2YzVuMHQaDwoFdWFydHISBmFtb3VudBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1'
                + 'NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYABIFEMCWsQIaQA81nG0NxT9zNWljZfBPiBUSeDayB73gSGlJLXTDKHZFDfFc6xiePlxDOeFw8vk5HT915eMSAQL9tAWF8N8UuC4=');
    });

    test('delegate TX valid', () => {
        expect(w.delegate(1000000).toString('base64'))
            .toEqual('CmIKYAomL2FydGVyeS5kZWxlZ2F0aW5nLnYxYmV0YTEuTXNnRGVsZWdhdGUSNgorYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBIHMTAwMDAwMBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQ'
                + 'th4SBAoCCAEYABIFEMCL5A4aQBZXrS0KSFMPGlKOl9hccde7LmOmIJaYGvnYdNyDZEYVWEqn1NqStbdgPp2B94D3Wb0z+opXu1+qRgy1GbJcZHQ=');
    });

    test('revoke TX valid', () => {
        expect(w.revoke(1000000).toString('base64'))
            .toEqual('CmAKXgokL2FydGVyeS5kZWxlZ2F0aW5nLnYxYmV0YTEuTXNnUmV2b2tlEjYKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSBzEwMDAwMDASWQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYe'
                + 'EgQKAggBGAASBRDAlrECGkBuGSqodVLYyQuV6Uop5KMoGmAmGGj2+b1XW7IVNd5AFztbhV5hxVZTJqpsTT3b8poCO9A77gVaWpbT5mTXqZkH');
    });

    test('buyImStorage TX valid', () => {
        expect(w.buyImStorage(1).toString('base64'))
            .toEqual('CmEKXwosL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnQnV5SW1FeHRyYVN0b3JhZ2USLworYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBABElkKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKGjBKX4a3G+3Jz/hXQdon4Rh+QlExH8CV/iVAKbBC2'
                + 'HhIECgIIARgAEgUQwJaxAhpAATN2tr1c0iESvclSs5wbD4rXEzrBp4g+7hgYRtB5Ma8rcur8YSZMvvSySYbyW0JBcVZsZFMDxbo3OKSgT7cPqA==');
    });

    test('giveUpImExtra TX valid', () => {
        expect(w.giveUpImExtra(1).toString('base64'))
            .toEqual('Cl0KWwooL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnR2l2ZVVwSW1FeHRyYRIvCithcnRyMWEyOTVnZ201OWs4ZGZxbXJocHZudWpzNmM0aGZocXMwZGZsbmFoEAESWQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYeEgQK'
                + 'AggBGAASBRDAlrECGkBh2kQCaee/aZViUyNUaYDczHIC9i+u7dOBX2qyVyfQ4VkMv8craRn1HTW0ZSS1i5NjxK0zuSNYuq5inTbtakYJ');
    });

    test('prolongImExtra TX valid', () => {
        expect(w.prolongImExtra().toString('base64'))
            .toEqual('ClwKWgopL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnUHJvbG9uZ0ltRXh0cmESLQorYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoC'
                + 'CAEYABIFEMCWsQIaQChw69ATm2cTqdz/lngDYW309464Ywpi3Z24QjAUOeUTWJH1UMhpfPoKyS5yzX+sfCfVxS6q8xIKRC+9Jody1KI=');
    });
});
