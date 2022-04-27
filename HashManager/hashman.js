import { createSidebarItem, sidebar } from "/box/box.js"
import { numFormat } from "/format.js"

/** @param {NS} ns **/
export async function main(ns) {
	let style=`<style>
	</style>`;
	let item=createSidebarItem("HashManager",`
		${style}
		<div class=g2></div>
		<div class=g2>
			<span class="hm span">
				<center>Servers: <div id="HM_serverNum"></div></br>
				Hashes: <div id="HM_hashes"></div></br>
				<button id="HM_cashout">Cash Out</button></br>
				Hash Rate: <div id="HM_hashrate"></div></br>
				</center>
			</span>
			</br>
			<span>
				-Upgrades-</br></br>
				<button id="HM_levelUpgrade" class="hm upgradebutton">Level</button></br>
				Hashrate:<div id="HM_levelHashrate"></div></br>
				Cost:<div id="HM_levelUpgradeCost"></div></br>
				per Hash:<div id="HM_levelPerHashCost"></div></br>
				</br>
				<button id="HM_ramUpgrade" class="hm upgradebutton">RAM</button></br>
				Hashrate:<div id="HM_ramHashrate"></div></br>
				Cost:<div id="HM_ramUpgradeCost"></div></br>
				per Hash:<div id="HM_ramPerHashCost"></div></br>
				</br>
				<button id="HM_coreUpgrade" class="hm upgradebutton">Cores</button></br>
				Hashrate:<div id="HM_coreHashrate"></div></br>
				Cost:<div id="HM_coreUpgradeCost"></div></br>
				per Hash:<div id="HM_corePerHashCost"></div></br>
				</br>
				<button id="HM_cacheUpgrade" class="hm upgradebutton">Cache</button></br>
				Cost:<div id="HM_cacheUpgradeCost"></div></br>
			</span>
		</div>`,"&#xeb7c");
	//&#xe0af
	let hm_running=true;

	let moneyFormat=(money)=> {
		return "$" + numFormat(money);
	}
	
	let numNodes = ns.hacknet.numNodes();

	async function updateHacknet() {
		if (!sidebar.contains(item)) {hm_running=false; return;};

		let playerProduction = ns.getHacknetMultipliers().production;
		numNodes = ns.hacknet.numNodes();
		let nodeStats = ns.hacknet.getNodeStats(0);
		let nodeHashRate = ns.formulas.hacknetServers.hashGainRate(nodeStats.level, nodeStats.ramUsed, nodeStats.ram, nodeStats.cores, playerProduction);
		let prodRate = nodeStats.production * numNodes;

		item.querySelector("#HM_serverNum").innerHTML = `${numNodes}`;
		item.querySelector("#HM_hashes").innerHTML = `${ns.nFormat(ns.hacknet.numHashes(),"0.000")}/${ns.hacknet.hashCapacity()}`;
		item.querySelector("#HM_hashrate").innerHTML = `${ns.nFormat(prodRate,"0.000")} h/s`;

		let levelHashRateInc = ns.formulas.hacknetServers.hashGainRate(nodeStats.level + 1, nodeStats.ramUsed, nodeStats.ram, nodeStats.cores, playerProduction) - nodeHashRate;
		let ramHashRateInc = ns.formulas.hacknetServers.hashGainRate(nodeStats.level, nodeStats.ramUsed, nodeStats.ram + 1, nodeStats.cores, playerProduction) - nodeHashRate;
		let coreHashRateInc = ns.formulas.hacknetServers.hashGainRate(nodeStats.level, nodeStats.ramUsed, nodeStats.ram, nodeStats.cores + 1, playerProduction) - nodeHashRate;

		item.querySelector("#HM_levelHashrate").innerHTML = `${levelHashRateInc * numNodes}`;
		item.querySelector("#HM_ramHashrate").innerHTML = `${ramHashRateInc * numNodes}`;
		item.querySelector("#HM_coreHashrate").innerHTML = `${coreHashRateInc * numNodes}`;

		let levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(0,1);
		let ramUpgradeCost = ns.hacknet.getRamUpgradeCost(0,1);
		let coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(0,1);
		let cacheUpgradeCost = ns.hacknet.getCacheUpgradeCost(0,1);		

		item.querySelector("#HM_levelUpgradeCost").innerHTML = `${moneyFormat(levelUpgradeCost * numNodes)}`;
		item.querySelector("#HM_ramUpgradeCost").innerHTML = `${moneyFormat(ramUpgradeCost * numNodes)}`;
		item.querySelector("#HM_coreUpgradeCost").innerHTML = `${moneyFormat(coreUpgradeCost * numNodes)}`;
		item.querySelector("#HM_cacheUpgradeCost").innerHTML = `${moneyFormat(cacheUpgradeCost * numNodes)}`;

		item.querySelector("#HM_levelPerHashCost").innerHTML = `${numFormat(levelUpgradeCost / levelHashRateInc)}`;
		item.querySelector("#HM_ramPerHashCost").innerHTML = `${numFormat(ramUpgradeCost / ramHashRateInc)}`;
		item.querySelector("#HM_corePerHashCost").innerHTML = `${numFormat(coreUpgradeCost / coreHashRateInc)}`;
	}

	let id_cashout = `#HM_cashout`;
	let button_cashout = item.querySelector(id_cashout);
	button_cashout.addEventListener("click", function() {
		var hashes = ns.hacknet.numHashes();
		var buyNum = Math.floor(hashes/4);
		for(var i = 0; i < buyNum; i++) {
			ns.hacknet.spendHashes("Sell for Money");
		}
		ns.tprint("[HashManager] Got " + moneyFormat(buyNum*1000000) + " for " + (buyNum*4) + " hashes.")
		updateHacknet();
	});

	let id_levelUpgrade = `#HM_levelUpgrade`;
	let button_levelUpgrade = item.querySelector(id_levelUpgrade);
	button_levelUpgrade.addEventListener("click", function() {
		for(let i=0;i<numNodes;i++) {
			ns.hacknet.upgradeLevel(i,1);
		}
		updateHacknet();
	});

	let id_ramUpgrade = `#HM_ramUpgrade`;
	let button_ramUpgrade = item.querySelector(id_ramUpgrade);
	button_ramUpgrade.addEventListener("click", async function() {
		for(let i=0;i<numNodes;i++) {
			ns.hacknet.upgradeRam(i,1);
		}
		updateHacknet();
	});

	let id_coreUpgrade = `#HM_coreUpgrade`;
	let button_coreUpgrade = item.querySelector(id_coreUpgrade);
	button_coreUpgrade.addEventListener("click", async function() {
		for(let i=0;i<numNodes;i++) {
			ns.hacknet.upgradeCore(i,1);
		}
		updateHacknet();
	});

	let id_cacheUpgrade = `#HM_cacheUpgrade`;
	let button_cacheUpgrade = item.querySelector(id_cacheUpgrade);
	button_cacheUpgrade.addEventListener("click", async function() {
		for(let i=0;i<numNodes;i++) {
			ns.hacknet.upgradeCache(i,1);
		}
		updateHacknet();
	});

	while(hm_running) {
		updateHacknet();
		await ns.asleep(1000);
	}

}