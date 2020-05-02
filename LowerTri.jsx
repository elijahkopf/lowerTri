function lowerTri(thisObj){ // Funktsioon, mis konstrueerib akna ning vajaminevat käitumist

    var minuFail;
    var tekstid;
    var varvid;
    var andmed;

    var aken = new Window("palette", "LowerTri", undefined, {resizeable:false, closeButton: true}); // Peamine aken

    aken.show();

    // Vajalikud aknaosad
     ehitus_1 = "group{orientation:'column',\
                    gruppUks: Group{orientation:'column',\
                    oppeTekst: StaticText{text:'Palun vali peamine kompositsioon ja seejärel vajuta \"Vali fail\" nupp.'},\
                    valiFailNupp: Button{text:'Vali fail'},\
            },\
        }";

    ehitus_2 = "group{orientation:'column',\
                tekstiKihtTekst: StaticText{text:'Leidsin järgmised tekstikihid:'},\
                tekstid: Panel{orientation:'column'},\
                varviKihtTekst: StaticText{text:'Leidsin järgmised värvi atribuudid:'},\
                varvid: Panel{orientation:'column'},\
                }";

    ehitus_3 = "group{orientation:'column',\
                    gruppKolm: Group{orientation:'column',\
                    tekstiKihtTekst: StaticText{text:'Kui oled valinud kõik vajalikud muudatused, vajuta  \"Tee muudatused\" nupp'},\
                    muudatusedNupp: Button{text:'Tee muudatused'},\
            },\
        }";

    aken.grp1 = aken.add(ehitus_1);
    aken.grp2 = aken.add(ehitus_2);
    aken.grp3 = aken.add(ehitus_3);
    uuendaPaneel(aken);

    aken.grp1.gruppUks.valiFailNupp.onClick = function() {
        var mainComp = app.project.activeItem;

        if (mainComp && mainComp.typeName == "Composition") {

            app.beginUndoGroup("Ava fail ja loe info sisse");
            minuFail = File.openDialog("Vali fail informatsiooniga");

            if (minuFail != null){
                var fileOK = minuFail.open("r");
                if (fileOK){
                    var rida = loeRida(minuFail);
                    if(rida.split() == ""){
                        alert("See fail on tühi!");
                    } else {
                        andmed = rida.split(';');
                        andmed.push("ei muuda");

                        korista(aken.grp2);
                        aken.grp2 = aken.grp2.add(ehitus_2);

                        tekstid = getKihid(0, mainComp);

                        for(var i = 0; i < tekstid.length; i++){
                            var tekstidePaneel = aken.grp2.tekstid.add("Group {orientation:'row', alignment: 'right'}");
                            tekstidePaneel.add("statictext", undefined, tekstid[i][0]);
                            var ddl = tekstidePaneel.add("dropdownlist", undefined, andmed);
                            ddl.selection = andmed.length-1;
                        }

                        aken.grp2.tekstid.add("statictext", undefined, "Palun vali kuidas parameetrid muudetakse");

                        varvid = getKihid(1, mainComp);

                        for(var i = 0; i < varvid.length; i++){
                            aken.grp2.varvid.varvidePaneel = aken.grp2.varvid.add("Group {orientation:'row', alignment: 'right'}");
                            aken.grp2.varvid.varvidePaneel.add("statictext", undefined, varvid[i][0]);
                            aken.grp2.varvid.varvidePaneel.add("statictext", undefined, varvid[i][1]);
                            var ddl2 = aken.grp2.varvid.varvidePaneel.add("dropdownlist", undefined, andmed);
                            ddl2.selection = andmed.length-1;
                        }

                        aken.grp2.varvid.add("statictext", undefined, "Palun vali kuidas parameetrid muudetakse");
                        uuendaPaneel(aken);

                    }

                } else alert("Midagi läks valesti! Ei suutnud lugeda faili!");
            } else alert("Faili ei ole valitud.");

            app.endUndoGroup("Ava fail ja loe info sisse");

        } else alert("Kompositsioon ei ole valitud");
        
    }

    aken.grp3.gruppKolm.muudatusedNupp.onClick = function() {
        var vahetaTekst = [];
        var vahetaVarv  = [];

        for(var i = 0; i < tekstid.length; i++){
            if(aken.grp2.tekstid.children[i].children[1].selection.toString() == "ei muuda") continue;
            vahetaTekst.push([tekstid[i][1].toString(), andmed.indexOf(aken.grp2.tekstid.children[i].children[1].selection.toString())]);}
        
        for(var i = 0; i < varvid.length; i++){
            if(aken.grp2.varvid.children[i].children[2].selection.toString() == "ei muuda") continue;
            vahetaVarv.push([varvid[i][2], varvid[i][3], andmed.indexOf(aken.grp2.varvid.children[i].children[2].selection.toString())]);}

        rida = loeRida(minuFail);

        while(rida != ""){
            var info = rida.split(';');
            info = kontrolliPikkused(info);
            kopeeriStruktuur(app.project.activeItem, vahetaTekst, vahetaVarv, info);
            rida = loeRida(minuFail);
        }

        minuFail.close();
        alert("Muudatused on edukalt rakendatud! Võib skriptiakna kinni panna.")
        
    }
}

function uuendaPaneel(konteiner){ // Funktsioon, mis uuendab konteineri välimuse
konteiner.layout.layout(true);
}

function loeRida(fail){ // Funktsioon, mis loeb antud faili rida
    return fail.readln();
}

function korista(konteiner){ // Funktsioon, mis koristab konteineri sisu tühjaks
    while (konteiner.children[0]) konteiner.remove(konteiner.children[0]);
}

function getKihid(valik, comp){ // Funktsioon, mis otsib antud kompositsioonist vajalikke kihte
        var arr = [];

        switch(valik){

                case 0: // otsi tekstikihid
                    for (var i = 1; i < comp.numLayers + 1; i++) {
                        if(comp.layer(i) instanceof TextLayer) arr.push([comp.layer(i).name, i]);}
                    break;

                case 1: // otsi reguleerimiskiht 
                    for (var i = 1; i < comp.numLayers + 1; i++) {
                        if(comp.layer(i) instanceof AVLayer && comp.layer(i).property("Masks").numProperties < 1){

                            var adjKiht = comp.layer(i).Effects.numProperties;

                            for(var j = 1; j < adjKiht + 1; j++){
                                arr.push([comp.layer(i).name, comp.layer(i).Effects.property(j).name, i, j]);
                            }
                        }
                    }
                    break;
        }

    return arr;
}

function kopeeriStruktuur(comp, tekstid_asukoht, varvid_asukoht, vahetused){ // Peamine funktsioon, mis kopeerib kompositsiooni ja vahetab teksti ja värvi
    var comp = comp.duplicate();
    comp.name = vahetused[0];

    for(var i = 0; i < tekstid_asukoht.length; i++){
        var kiht = comp.layer(parseInt(tekstid_asukoht[i][0]));
        kiht.property("Source Text").setValue(vahetused[tekstid_asukoht[i][1]]);
    }

    for(var i = 0; i < varvid_asukoht.length; i++){
        var kiht = comp.layer(parseInt(varvid_asukoht[i][0]));
        kiht.Effects.property(parseInt(varvid_asukoht[i][1])).property("Color").setValue(hexToRGB(vahetused[varvid_asukoht[i][2]]));
    }

    return comp;
}

function hexToRGB(hex){ // Funktsioon teisendab värvikoodi programmile arusaadavaks kujuks
	var rgb = parseInt(hex, 16); 
	var r   = (rgb >>16) & 0xFF; 
	var g = (rgb >>8) & 0xFF; 
	var b  = rgb & 0xFF;
	
	return [r/255.0, g/255.0, b/255.0];
}

function kontrolliPikkused(info){ // Funktsioon kontrollib antud infolõiku pikkuse järgi, ja kui see on liiga pikk, lisab reavahe
    for(var i = 0; i < info.length; i++){
        if(info[i].length > 65){
            var indeks = info[i].indexOf(',', 30);
            info[i] = setCharAt(info[i], indeks+1, '\n');
        }
    }
    return info;
}

function setCharAt(str,index,chr) { // Funktsioon lisab antud sõnesse antud positsioonile antud tähe
    return str.substr(0,index) + chr + str.substr(index+1);
}

lowerTri(this);