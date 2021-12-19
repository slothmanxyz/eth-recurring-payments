const chai = require('chai');
const { expect } = require('chai');
const { waffle } = require('hardhat');
const provider = waffle.provider;

const delta = 1e3;

const bigNum2Int=(bn)=>{
  return parseInt(bn.toString())
}

describe("Subscription", async () => {
  let deployer, subscriber, external_beneficiary, contract_beneficiary;

  var simp_address;
  var subscriber_address;
  var SimpToken;
  var subscriberBasic;

  beforeEach(async() => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    subscriber = signers[1];
    external_beneficiary = signers[2];
    contract_beneficiary = signers[3];

    simp_address = require("../deployments/localhost/SimpleToken.json").address;
    subscriber_address = require("../deployments/localhost/SubscriberBasic.json").address;

    SimpTokenFactory = await ethers.getContractFactory('SimpleToken');
    SubscriberFactory = await ethers.getContractFactory('SubscriberBasic');
    SubBeneficiaryFactory = await ethers.getContractFactory('SubBeneficiary');
  
    SimpToken = await SimpTokenFactory.attach(simp_address);
    SubscriberBasic = await (await SubscriberFactory.attach(subscriber_address)).connect(subscriber);
  });

  it("EOA subscription and collection", async() => {
    expect(await provider.getBalance(subscriber_address)).to.be.above(1);
    var receipt = await (await SubscriberBasic.subscribe(
      await external_beneficiary.getAddress(),
      1,
      30, /// 30 seconds
      0,  /// can collect now
      ethers.constants.AddressZero,   /// ether
      []
    )).wait();
    var newEvents = receipt.events?.filter((x)=>{return x.event=='Subscription'});
    var eventArgs = newEvents[newEvents.length-1].args;
    expect(bigNum2Int(eventArgs.next_payment)).is.closeTo(
      new Date().getTime()/1000, delta
    );

    await setTimeout(()=>{}, 30*1e3);
    
    SubscriberBasic = await SubscriberBasic.connect(external_beneficiary);
    receipt = await (await SubscriberBasic.collect(
      external_beneficiary.address,
      1,
      ethers.constants.AddressZero
    )).wait();
    newEvents = receipt.events?.filter((x)=>{return x.event=='Payment'});
    eventArgs = newEvents[newEvents.length-1].args;
    console.log(eventArgs);
  });
});