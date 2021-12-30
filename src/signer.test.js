const tx = require('./signer');

const privKey = '86e811135fddc71d23595d12ae83c42ccac02daa8a36ffa30049d839a605eabc';
const pubKey = '02868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e';

describe('Transactions', () => {
    describe('bank/MsgSend', () => {
        const msgType = '/artery.bank.v1beta1.MsgSend';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    from: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    to: 'artr1unyqx6ldzkp6f4nnpppq4cez279lqk05ltcpfu',
                    amount: '1000000',
                    gas: '25000000',
                    memo: 'Привет'
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                bodyBytes: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d182',
                signBytes: '0a9d010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d18212590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0f0f50b1a0774657374696e6720d209',
                signature: '2fe225993ff8089fbf93bccaef34ad1fc6e7c5192dfd17ca3bc3c9474fe1c7630808ef534af7343f54a7650f281cc8740bb5b66e34d10fe3c2e1cea0bcc95a7b',
                tx: '0a9d010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d18212590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0f0f50b1a402fe225993ff8089fbf93bccaef34ad1fc6e7c5192dfd17ca3bc3c9474fe1c7630808ef534af7343f54a7650f281cc8740bb5b66e34d10fe3c2e1cea0bcc95a7b',
                result: '{"tx_bytes":"Cp0BCowBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxdW55cXg2bGR6a3A2ZjRubnBwcHE0Y2V6Mjc5bHFrMDVsdGNwZnUaEAoFdWFydHISBzEwMDAwMDASDNCf0YDQuNCy0LXRghJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYOBIFEMDw9QsaQC/iJZk/+Aifv5O8yu80rR/G58UZLf0XyjvDyUdP4cdjCAjvU0r3ND9Up2UPKBzIdAu1tm400Q/jwuHOoLzJWns=","mode":"BROADCAST_MODE_ASYNC"}'
            },
            {
                case: 'Without memo',
                data: {
                    from: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    to: 'artr1unyqx6ldzkp6f4nnpppq4cez279lqk05ltcpfu',
                    amount: '1000000',
                    gas: '25000000',
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                bodyBytes: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                signBytes: '0a8f010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a05756172747212073130303030303012590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0f0f50b1a0774657374696e6720d209',
                signature: '923b29ea41e43d5ad0feb8da140f278beb577695e42e3c627daa8d84cd976f033df989cc56b48c599ff7441204e624f2b0ed70369f7ea1878a37feb400949c6b',
                tx: '0a8f010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a05756172747212073130303030303012590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0f0f50b1a40923b29ea41e43d5ad0feb8da140f278beb577695e42e3c627daa8d84cd976f033df989cc56b48c599ff7441204e624f2b0ed70369f7ea1878a37feb400949c6b',
                result: '{"tx_bytes":"Co8BCowBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxdW55cXg2bGR6a3A2ZjRubnBwcHE0Y2V6Mjc5bHFrMDVsdGNwZnUaEAoFdWFydHISBzEwMDAwMDASWQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYeEgQKAggBGDgSBRDA8PULGkCSOynqQeQ9WtD+uNoUDyeL61d2leQuPGJ9qo2EzZdvAz35icxWtIxZn/dEEgTmJPKw7XA2n36hh4o3/rQAlJxr","mode":"BROADCAST_MODE_ASYNC"}'

            },
            {
                case: 'Without gas',
                data: {
                    from: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    to: 'artr1unyqx6ldzkp6f4nnpppq4cez279lqk05ltcpfu',
                    amount: '1000000',
                    memo: 'Привет',
                    gas: '0' // It would be set to 21000000 default otherwise
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                bodyBytes: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d182',
                signBytes: '0a9d010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d18212540a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812001a0774657374696e6720d209',
                signature: 'f730cfad6cade5da2805bda862087529c6986b1174f49446b011c1aa04dd0e031453b436df707e3ae86b71991bc58121ec3feea045bc0d952f91bfc20d5d0c68',
                tx: '0a9d010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030120cd09fd180d0b8d0b2d0b5d18212540a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812001a40f730cfad6cade5da2805bda862087529c6986b1174f49446b011c1aa04dd0e031453b436df707e3ae86b71991bc58121ec3feea045bc0d952f91bfc20d5d0c68',
                result: '{"tx_bytes":"Cp0BCowBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxdW55cXg2bGR6a3A2ZjRubnBwcHE0Y2V6Mjc5bHFrMDVsdGNwZnUaEAoFdWFydHISBzEwMDAwMDASDNCf0YDQuNCy0LXRghJUClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYOBIAGkD3MM+tbK3l2igFvahiCHUpxphrEXT0lEawEcGqBN0OAxRTtDbfcH466GtxmRvFgSHsP+6gRbwNlS+Rv8INXQxo","mode":"BROADCAST_MODE_ASYNC"}'
            },
            {
                case: 'With neither memo nor gas',
                data: {
                    from: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    to: 'artr1unyqx6ldzkp6f4nnpppq4cez279lqk05ltcpfu',
                    amount: '1000000',
                    gas: '0' // It would be set to 21000000 default otherwise
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                bodyBytes: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030',
                signBytes: '0a8f010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a05756172747212073130303030303012540a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812001a0774657374696e6720d209',
                signature: '4defd5d84a09f4b35f1a706184cdaf19c8593fba67b7597e10c930d06054ebb608b9bcb3ed32cad3f770110afe7de45d10de527bb5c0579c182250c3c7c952e9',
                tx: '0a8f010a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a05756172747212073130303030303012540a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812001a404defd5d84a09f4b35f1a706184cdaf19c8593fba67b7597e10c930d06054ebb608b9bcb3ed32cad3f770110afe7de45d10de527bb5c0579c182250c3c7c952e9',
                result: '{"tx_bytes":"Co8BCowBChwvYXJ0ZXJ5LmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSK2FydHIxdW55cXg2bGR6a3A2ZjRubnBwcHE0Y2V6Mjc5bHFrMDVsdGNwZnUaEAoFdWFydHISBzEwMDAwMDASVApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYeEgQKAggBGDgSABpATe/V2EoJ9LNfGnBhhM2vGchZP7pnt1l+EMkw0GBU67YIubyz7TLK0/dwEQr+feRdEN5Se7XAV5wYIlDDx8lS6Q==","mode":"BROADCAST_MODE_ASYNC"}'
            },
        ];

        function msg(data) {
            return {
                from_address: data.from,
                to_address: data.to,
                amount: [
                    {
                        denom: 'uartr',
                        amount: data.amount
                    }
                ]
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {from, to, amount, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.send(signer, from, to, amount, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {from, to, amount, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.send(signer, from, to, amount, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });

    describe('delegating/MsgDelegate', () => {
        const msgType = '/artery.delegating.v1beta1.MsgDelegate';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    amount: '10000000',
                    gas: '9000000000',
                    memo: 'Привет'
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030',
                bodyBytes: '0a610a262f6172746572792e64656c65676174696e672e763162657461312e4d736744656c656761746512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182',
                signBytes: '0a710a610a262f6172746572792e64656c65676174696e672e763162657461312e4d736744656c656761746512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182125a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812061080b4c4c3211a0774657374696e6720d209',
                signature: '2115d176cfdd5267b5cfcf33094471ced22cceff37db593ec77c1659c4f5d5501e06217ec2599623fbe93fddd74f53d6068b9f62891150552e4091f4fd4bdd3a',
                tx: '0a710a610a262f6172746572792e64656c65676174696e672e763162657461312e4d736744656c656761746512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182125a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812061080b4c4c3211a402115d176cfdd5267b5cfcf33094471ced22cceff37db593ec77c1659c4f5d5501e06217ec2599623fbe93fddd74f53d6068b9f62891150552e4091f4fd4bdd3a',
                result: '{"tx_bytes":"CnEKYQomL2FydGVyeS5kZWxlZ2F0aW5nLnYxYmV0YTEuTXNnRGVsZWdhdGUSNworYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBIIMTAwMDAwMDASDNCf0YDQuNCy0LXRghJaClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYOBIGEIC0xMMhGkAhFdF2z91SZ7XPzzMJRHHO0izO/zfbWT7HfBZZxPXVUB4GIX7CWZYj++k/3ddPU9YGi59iiRFQVS5AkfT9S906","mode":"BROADCAST_MODE_ASYNC"}'

            },
        ];

        function msg(data) {
            return {
                address: data.address,
                micro_coins: data.amount,
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.delegate(signer, address, amount, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.delegate(signer, address, amount, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });

    describe('delegating/MsgRevoke', () => {
        const msgType = '/artery.delegating.v1beta1.MsgRevoke';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    amount: '10000000',
                    gas: '9000000000',
                    memo: 'Привет'
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030',
                bodyBytes: '0a5f0a242f6172746572792e64656c65676174696e672e763162657461312e4d73675265766f6b6512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182',
                signBytes: '0a6f0a5f0a242f6172746572792e64656c65676174696e672e763162657461312e4d73675265766f6b6512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182125a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812061080b4c4c3211a0774657374696e6720d209',
                signature: 'b93c9c0b0d312e1b0b6f760cb8cf7aae463e616e940669b4e5ac67f6306c2fc36d9d257811a3c38f63d4b4e425869e9240fa253b62408ea328ed3cda591f4b8e',
                tx: '0a6f0a5f0a242f6172746572792e64656c65676174696e672e763162657461312e4d73675265766f6b6512370a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812083130303030303030120cd09fd180d0b8d0b2d0b5d182125a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a020801183812061080b4c4c3211a40b93c9c0b0d312e1b0b6f760cb8cf7aae463e616e940669b4e5ac67f6306c2fc36d9d257811a3c38f63d4b4e425869e9240fa253b62408ea328ed3cda591f4b8e',
                result: '{"tx_bytes":"Cm8KXwokL2FydGVyeS5kZWxlZ2F0aW5nLnYxYmV0YTEuTXNnUmV2b2tlEjcKK2FydHIxYTI5NWdnbTU5azhkZnFtcmhwdm51anM2YzRoZmhxczBkZmxuYWgSCDEwMDAwMDAwEgzQn9GA0LjQstC10YISWgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYeEgQKAggBGDgSBhCAtMTDIRpAuTycCw0xLhsLb3YMuM96rkY+YW6UBmm05axn9jBsL8NtnSV4EaPDj2PUtOQlhp6SQPolO2JAjqMo7TzaWR9Ljg==","mode":"BROADCAST_MODE_ASYNC"}'
            },
        ];

        function msg(data) {
            return {
                address: data.address,
                micro_coins: data.amount,
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.revoke(signer, address, amount, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.revoke(signer, address, amount, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });

    describe('profile/MsgBuyImExtraStorage', () => {
        const msgType = '/artery.profile.v1beta1.MsgBuyImExtraStorage';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    amount: 13,
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100d',
                bodyBytes: '0a5f0a2c2f6172746572792e70726f66696c652e763162657461312e4d7367427579496d457874726153746f72616765122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100d',
                signBytes: '0a610a5f0a2c2f6172746572792e70726f66696c652e763162657461312e4d7367427579496d457874726153746f72616765122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100d12590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a0774657374696e6720d209',
                signature: '6aae557184535e4f22a914e5ec5178346ca61d31a964647cc00931a7f02f029a7ba9499965a485d3641c58ee764fd28993256a0c9c865dfa052fa93fc96c363f',
                tx: '0a610a5f0a2c2f6172746572792e70726f66696c652e763162657461312e4d7367427579496d457874726153746f72616765122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100d12590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a406aae557184535e4f22a914e5ec5178346ca61d31a964647cc00931a7f02f029a7ba9499965a485d3641c58ee764fd28993256a0c9c865dfa052fa93fc96c363f',
                result: '{"tx_bytes":"CmEKXwosL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnQnV5SW1FeHRyYVN0b3JhZ2USLworYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBANElkKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKGjBKX4a3G+3Jz/hXQdon4Rh+QlExH8CV/iVAKbBC2HhIECgIIARg4EgUQwN6BChpAaq5VcYRTXk8iqRTl7FF4NGymHTGpZGR8wAkxp/AvApp7qUmZZaSF02QcWO52T9KJkyVqDJyGXfoFL6k/yWw2Pw==","mode":"BROADCAST_MODE_ASYNC"}'
            }
        ];

        function msg(data) {
            return {
                address: data.address,
                extra_storage: data.amount,
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.buyImStorage(signer, address, amount, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.buyImStorage(signer, address, amount, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas);
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });

    describe('profile/MsgGiveUpImExtra', () => {
        const msgType = '/artery.profile.v1beta1.MsgGiveUpImExtra';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    amount: 12,
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100c',
                bodyBytes: '0a5b0a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100c',
                signBytes: '0a5d0a5b0a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100c12590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a0774657374696e6720d209',
                signature: 'b702290cac117f1c5148cedc02ced7c6ca13e4ba44c6e7c7dd1436d437fd3d6161c3e11ae0312b8cdefe8788b93148b0a02af83a7998ab02647e015ee8347086',
                tx: '0a5d0a5b0a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122f0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168100c12590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a40b702290cac117f1c5148cedc02ced7c6ca13e4ba44c6e7c7dd1436d437fd3d6161c3e11ae0312b8cdefe8788b93148b0a02af83a7998ab02647e015ee8347086',
                result: '{"tx_bytes":"Cl0KWwooL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnR2l2ZVVwSW1FeHRyYRIvCithcnRyMWEyOTVnZ201OWs4ZGZxbXJocHZudWpzNmM0aGZocXMwZGZsbmFoEAwSWQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAoaMEpfhrcb7cnP+FdB2ifhGH5CUTEfwJX+JUApsELYeEgQKAggBGDgSBRDA3oEKGkC3AikMrBF/HFFIztwCztfGyhPkukTG58fdFDbUN/09YWHD4RrgMSuM3v6HiLkxSLCgKvg6eZirAmR+AV7oNHCG","mode":"BROADCAST_MODE_ASYNC"}'
            },
            {
                case: 'To the ground',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                    amount: 0,
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168',
                bodyBytes: '0a590a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168',
                signBytes: '0a5b0a590a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a0774657374696e6720d209',
                signature: '975ddd4ea14e16b48cc16d8a7e247d3e386b0e56a96733acaee1ab699064e256403077b7ad58cee97949cff6e46ca787beff9004182dcdc6b6783d97b6099a6c',
                tx: '0a5b0a590a282f6172746572792e70726f66696c652e763162657461312e4d7367476976655570496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a40975ddd4ea14e16b48cc16d8a7e247d3e386b0e56a96733acaee1ab699064e256403077b7ad58cee97949cff6e46ca787beff9004182dcdc6b6783d97b6099a6c',
                result: '{"tx_bytes":"ClsKWQooL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnR2l2ZVVwSW1FeHRyYRItCithcnRyMWEyOTVnZ201OWs4ZGZxbXJocHZudWpzNmM0aGZocXMwZGZsbmFoElkKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKGjBKX4a3G+3Jz/hXQdon4Rh+QlExH8CV/iVAKbBC2HhIECgIIARg4EgUQwN6BChpAl13dTqFOFrSMwW2KfiR9PjhrDlapZzOsruGraZBk4lZAMHe3rVjO6XlJz/bkbKeHvv+QBBgtzca2eD2XtgmabA==","mode":"BROADCAST_MODE_ASYNC"}'
            },
        ];

        function msg(data) {
            return {
                address: data.address,
                amount: data.amount,
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.giveUpImExtra(signer, address, amount, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, amount, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.giveUpImExtra(signer, address, amount, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas || '21000000');
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas || '21000000');
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });

    describe('profile/MsgProlongImExtra', () => {
        const msgType = '/artery.profile.v1beta1.MsgProlongImExtra';
        const matrix = [
            {
                case: 'Basic',
                data: {
                    address: 'artr1a295ggm59k8dfqmrhpvnujs6c4hfhqs0dflnah',
                },
                signer: {
                    accNo: '1234',
                    seqNo: '56',
                    chainId: 'testing',
                    privKey
                },
                proto: '0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168',
                bodyBytes: '0a5a0a292f6172746572792e70726f66696c652e763162657461312e4d736750726f6c6f6e67496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e6168',
                signBytes: '0a5c0a5a0a292f6172746572792e70726f66696c652e763162657461312e4d736750726f6c6f6e67496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a0774657374696e6720d209',
                signature: 'd7bcb37a704db7d0950cc948f06fde6a1c52ba93e8027d26735d4d9bd606436b6a8ddfbf97952eb8c55d1a3e7c05a5db135a4d8f5ec79ebdeaeb2876f32226e6',
                tx: '0a5c0a5a0a292f6172746572792e70726f66696c652e763162657461312e4d736750726f6c6f6e67496d4578747261122d0a2b61727472316132393567676d35396b386466716d726870766e756a7336633468666871733064666c6e616812590a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102868c1297e1adc6fb7273fe15d07689f8461f90944c47f0257f89500a6c10b61e12040a0208011838120510c0de810a1a40d7bcb37a704db7d0950cc948f06fde6a1c52ba93e8027d26735d4d9bd606436b6a8ddfbf97952eb8c55d1a3e7c05a5db135a4d8f5ec79ebdeaeb2876f32226e6',
                result: '{"tx_bytes":"ClwKWgopL2FydGVyeS5wcm9maWxlLnYxYmV0YTEuTXNnUHJvbG9uZ0ltRXh0cmESLQorYXJ0cjFhMjk1Z2dtNTlrOGRmcW1yaHB2bnVqczZjNGhmaHFzMGRmbG5haBJZClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChowSl+Gtxvtyc/4V0HaJ+EYfkJRMR/Alf4lQCmwQth4SBAoCCAEYOBIFEMDegQoaQNe8s3pwTbfQlQzJSPBv3mocUrqT6AJ9JnNdTZvWBkNrao3fv5eVLrjFXRo+fAWl2xNaTY9ex5696usodvMiJuY=","mode":"BROADCAST_MODE_ASYNC"}'
            },
        ];

        function msg(data) {
            return {
                address: data.address,
            };
        }

        describe('TX JSON matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, gas, memo, toh}, result}) => {
                expect(JSON.stringify(tx.wrap(tx.prolongImExtra(signer, address, gas, memo, toh)))).toEqual(result);
            });
        });

        describe('TX bytes matches', () => {
            test.each(matrix)('case: $case', ({signer, data: {address, gas, memo, toh}, tx: t}) => {
                expect(bytesToHex(tx.prolongImExtra(signer, address, gas, memo, toh))).toEqual(t);
            });
        });

        describe('Signature matches', () => {
            test.each(matrix)('case: $case', ({data, signer, signature}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas || '21000000');
                const signed = tx.$parts.getSignature(signer, body, auth);
                expect(bytesToHex(signed)).toEqual(signature);
            });
        });

        describe('TX sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, signer, signBytes}) => {
                const body = tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh);
                const auth = tx.$parts.getTxAuthBytes(signer, data.gas || '21000000');
                const sb = tx.$parts.getTxBytes(signer, body, auth);
                expect(bytesToHex(sb)).toEqual(signBytes);
            });
        });

        describe('TX body sign bytes match', () => {
            test.each(matrix)('case: $case', ({data, bodyBytes}) => {
                expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg(data), data.memo, data.toh || '0'))).toEqual(bodyBytes);
            });
        });

        describe('Protobuf serialization is canonical', () => {
            test.each(matrix)('case: $case', ({data, proto}) => {
                expect(bytesToHex(tx.$parts.getMsgBytes(msgType, msg(data)))).toEqual(proto);
            });
        });
    });
});

describe('Common Parts', () => {
    describe("The signRawBytes's result is same as Cosmos signers's", () => {
        test.each([
            {
                case: 'Some random data (64B length)',
                data: '08290e1fdbd9664be8283a4b55d7fae83965bd0c682b5f3cf85f51d3b5f08e3baa4a00c00ea8ab23e19b709fb63a3611520ef40b1e4390c408aefaf250ca6a93',
                expected: '8d92508c756a6903b9246126cc9af01fc0eefc252788658272655baca04ccceb6da9423cec5583753959732282716d8d3141a2dd2c84abaa3ff4e3248d31d183'
            }
        ])('case: $case', ({data, expected}) => {
            expect(bytesToHex(tx.$parts.signRawBytes(privKey, hexToBytes(data)))).toEqual(expected);
        });
    });

    describe('getTxBodyBytes serializes to canonical Protobuf', () => {
        const msgType = '/artery.bank.v1beta1.MsgSend';
        const msg = {
            from_address: 'artr1yjw550d4fua8yggd4dr65f2eh5a0t2sw22tsp2',
            to_address: 'artr1unyqx6ldzkp6f4nnpppq4cez279lqk05ltcpfu',
            amount: [{
                denom: 'uartr',
                amount: '1000000'
            }]
        };

        test.each([
            {
                memo: 'Hi!',
                toh: '1234567',
                expected: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b6172747231796a773535306434667561387967676434647236356632656835613074327377323274737032122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a05756172747212073130303030303012034869211887ad4b'
            },
            {
                memo: 'Hi!',
                toh: '0',
                expected: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b6172747231796a773535306434667561387967676434647236356632656835613074327377323274737032122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a0575617274721207313030303030301203486921'
            },
            {
                memo: '',
                toh: '1234567',
                expected: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b6172747231796a773535306434667561387967676434647236356632656835613074327377323274737032122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a0575617274721207313030303030301887ad4b'
            },
            {
                memo: '',
                toh: '0',
                expected: '0a8c010a1c2f6172746572792e62616e6b2e763162657461312e4d736753656e64126c0a2b6172747231796a773535306434667561387967676434647236356632656835613074327377323274737032122b6172747231756e797178366c647a6b703666346e6e707070713463657a3237396c716b30356c74637066751a100a057561727472120731303030303030'
            },
        ])('memo: $memo, toh: $toh', ({memo, toh, expected}) => {
            expect(bytesToHex(tx.$parts.getTxBodyBytes(msgType, msg, memo, toh))).toEqual(expected);
        });
    });

    describe('signature verification', () => {
        test.each([
            {
                case: 'Some data (64B length)',
                data: '08290e1fdbd9664be8283a4b55d7fae83965bd0c682b5f3cf85f51d3b5f08e3baa4a00c00ea8ab23e19b709fb63a3611520ef40b1e4390c408aefaf250ca6a93',
                signature: '8d92508c756a6903b9246126cc9af01fc0eefc252788658272655baca04ccceb6da9423cec5583753959732282716d8d3141a2dd2c84abaa3ff4e3248d31d183',
                expected: true
            },
            {
                case: 'Wrong signature',
                data: '08290e1fdbd9664be8283a4b55d7fae83965bd0c682b5f3cf85f51d3b5f08e3baa4a00c00ea8ab23e19b709fb63a3611520ef40b1e4390c408aefaf250ca6a93',
                signature: '8d92508c756a6903b9246126cc9af01fc0eefc252788658272655baca04ccceb6da9423cec5583753959732282716d8d3141a2dd2c84abaa3ff4e3248d31d184',
                expected: false
            },
        ])('case: $case', ({data, signature, expected}) => {
            expect(tx.$parts.verifyRawBytesSignature(pubKey, hexToBytes(data), hexToBytes(signature))).toEqual(expected);
        });
    });
});

const {bytesToHex, hexToBytes} = tx.$parts;
