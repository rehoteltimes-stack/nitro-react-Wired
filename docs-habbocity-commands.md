# HabboCity :commands list (read from their client bundle)

Source: the client's own `:commands` window (component in index-*.js), 103 rows, original French text. `Ours` = the command name exists in this hotel's emulator command keys (client-side commands such as build/furni/zoom are not in that table and show as no).


## Commandes tchat

| Command | Params | Description | Ours |
|---|---|---|---|
| Maintiens la touche SHIFT et appuie sur la touche Entrée |  | permet d'écrire en gras. | no |
| :crier | message | permet aussi d'écrire en gras. | no |
| :chut | pseudo, message | murmure en privé à l'utilisateur cible. | no |
| :dire | message | permet d'envoyer un message... pas très utile mais bon. | no |

## Commandes "smileys"

| Command | Params | Description | Ours |
|---|---|---|---|
| o/ |  | ton avatar salue. | no |
| _b |  | ton avatar lève son pouce. | no |
| :) |  | ton avatar sourit. | no |
| >:( |  | ton avatar est en colère. | no |
| :O |  | ton avatar est surpris. | no |
| :D |  | ton avatar est heureux. | no |
| : x |  | en cliquant sur une entité en même temps, permet de citer son pseudo en un éclair. | no |

## Commandes de postures

| Command | Params | Description | Ours |
|---|---|---|---|
| :sit |  | ton avatar s'assoit. | yes |
| :lay |  | ton avatar s'allonge. | yes |
| :stand |  | ton avatar se met debout. | yes |
| :jump |  | ton avatar saute. | no |
| :idle |  | ton avatar s'endort. | no |
| :sign | 0 à 17 | ton avatar porte un panneau. | no |
| :kiss |  | ton avatar fait un bisou. | no |
| :moonwalk |  | ton avatar marche à l'envers. | yes |

## Commandes outils

| Command | Params | Description | Ours |
|---|---|---|---|
| :chooser |  | affiche la liste des entités présents dans l'appartement. | no |
| :furni |  | affiche la liste des mobiliers dans l'appartement. | no |
| :build |  | affiche un outil de construction complet. | no |
| :buildmode |  | même commande que [build]. | no |
| :forceact | nombre | change l'état par défaut des prochains mobiliers posés ou déplacés. | no |
| :forceact stop |  | permet d'arrêter la commande [forceact]. | no |
| :forcerot | 0 à 7 | change la rotation des prochains mobiliers posés ou déplacés. | no |
| :forcerot stop |  | permet d'arrêter la commande [forcerot]. | no |
| :setz | nombre | change la hauteur des prochains mobiliers posés ou déplacés. | no |
| :setz stop |  | permet d'arrêter la commande [setz]. | no |
| :floor |  | ouvre le menu d'édition du sol. | no |
| :floornoitems |  | retire toutes les cases ne possédant pas de mobiliers. | no |
| :alldeleteitem |  | retire tous les mobiliers présents sur ta case. | no |
| :pickall |  | prend tous les mobiliers de l'appartement. | yes |
| :ejectall |  | retire tous TES mobiliers dans un appartement où tu es accrédité. Attention, si tu es le propriétaire de l'appartement, la commande retirera plutôt tous les mobiliers ne t'appartenant pas. Un staff est considéré comme propriétaire de tout appartements. | yes |
| :wired |  | affiche ou cache les wireds de l'appartement. | yes |
| :diagonal |  | retire la marche en diagonale dans ton appartement, réécris la commande pour annuler ce mode. | yes |
| :lock |  | met une sonnerie à ton appartement, la retire s'il y en avait déjà une. | no |
| :setmax | 1 à 200 | ajuste le nombre possible d'utilisateurs dans ton appartement. | yes |
| :setspeed | 1 à 500 | ajuste la vitesse des rollers de l'appartement. Plus le nombre est petit, plus le roller sera rapide. | yes |
| :roomkeb |  | rend aléatoire le keb entre les joueurs. | no |
| :zoom | nombre | permet de zoomer sur l'appartement. | no |
| :screenshot |  | prend une capture d'écran de l'appartement. | no |
| :pushmode |  | active les commandes pour pousser les joueurs. Réécris la commande pour désactiver. | no |
| :noalert |  | désactive les alertes des animations, réécris la commande pour réactiver. | no |
| :settings |  | ouvre le menu des paramètres de l'appartement. | no |

## Commandes de notification

| Command | Params | Description | Ours |
|---|---|---|---|
| :invite | message | envoie un message à tous tes amis. | no |
| :groupnotif | message | envoie un message à tous les membres du groupe se situant dans ton appartement. | no |
| :nomention |  | active ou désactive les mentions reçues. | no |
| @ | pseudo, message | envoie une mention à la cible de cette commande. | no |

## Commandes de suppressions

| Command | Params | Description | Ours |
|---|---|---|---|
| :empty |  | efface ton inventaire de mobiliers. | yes |
| :emptypets |  | efface ton inventaire d'animaux. | yes |
| :emptybots |  | efface ton inventaire de bots. | yes |
| :emptyfriends |  | efface tous tes amis. | no |
| :deletegroup |  | supprime le groupe de l'appartement actuel. | no |

## Commandes de modération

| Command | Params | Description | Ours |
|---|---|---|---|
| :kick | pseudo | exclut le joueur ciblé de l'appartement. | no |
| :roomkick |  | exclut l'entièreté des joueurs de l'appartement, à l'exception des personnes accréditées. | yes |
| :freeze | pseudo | congèle le joueur ciblé. Il ne pourra plus bouger. Réécris la commande pour le décongeler. | yes |
| :roomfreeze |  | congèle tous les joueurs de l'appartement, à l'exception des personnes accréditées. Ils ne peuvent plus bouger. Réécris la commande pour les décongeler. | no |
| :warp | pseudo | téléporte le joueur ciblé à ta position. | no |
| :warproom |  | téléporte tous les joueurs de l'appartement à ta position, à l'exception des personnes accréditées. | no |
| :teleport |  | active la téléportation instantannée à chaque case cliquée. | yes |
| :tele |  | identique à [teleport]. | yes |
| :noenable |  | retire l'enable à la cible. | no |
| :notransf |  | retire la transformation à la cible. | no |

## Commandes pour bots

| Command | Params | Description | Ours |
|---|---|---|---|
| :botenable | nombre, pseudo | donne un effet au bot. | no |
| :bothanditem | nombre, pseudo | donne un objet au bot. | no |
| :botsit | pseudo | fait s'asseoir le bot. | no |
| :botlay | pseudo | fait s'allonger le bot. | no |
| :botcontrol | pseudo | prend le contrôle du bot. | no |
| :botcontrol stop |  | arrête de contrôler le bot. | no |
| :botfollow | pseudo | le bot te suit. | no |
| :botfollow stop |  | le bot ne te suit plus. | no |
| :botsmute |  | les bots sont mis en sourdine. Réécris la commande pour réactiver. | no |
| :mimicbot | pseudo | copie l'apparence du bot. | no |

## Commandes d'aide

| Command | Params | Description | Ours |
|---|---|---|---|
| :help |  | ouvre le centre d'aide. | yes |
| :help enable |  | ouvre la liste des enables. | yes |
| :help handitem |  | ouvre la liste des handitems. | yes |
| :commands |  | ouvre la liste des commandes. | yes |

## Commandes fun

| Command | Params | Description | Ours |
|---|---|---|---|
| :punch | pseudo | ton avatar donne un coup de poing à la cible. | no |
| :push | pseudo | pousse la cible. Nécessite que [pushmode] soit activé. | yes |
| :pull | pseudo | tire la cible. Nécessite que [pushmode] soit activé. | yes |
| :spull | pseudo | tire la cible de loin. Nécessite que [pushmode] soit activé. | yes |
| :enable | nombre | active un effet. Consulte la liste des effets avec [help enable]. | yes |
| :enable stop |  | désactive l'effet actif. | yes |
| :enable freeze |  | permet de conserver l'effet actif même après avoir changé d'appartement. | yes |
| :handitem | nombre | donne un objet à ton joueur. Consulte la liste des objets avec [help handitem]. | yes |
| :cars |  | ton avatar prend la voiture. Il se déplacera deux fois plus vite. Réécris la commande pour la désactiver. | no |
| :mimic | pseudo | copie l'apparence d'un joueur. | yes |
| :follow | pseudo | rejoins un joueur situé dans un autre appartement. | yes |
| :shake |  | secoue l'appartement. | no |
| :iddqd |  | renverse l'appartement. Semblable à [zoom -1], utilise [zoom 1] pour remettre l'appartement à l'endroit. | no |
| :flip |  | identique à [iddqd]. | no |
| :noface |  | ton avatar perd son visage. | no |
| :eyes |  | pareil que [noface]. | no |
| :togglefps |  | réduit le nombre d'images par secondes. Réécris la commande pour revenir en arrière. | no |

## Commandes VIP

| Command | Params | Description | Ours |
|---|---|---|---|
| :enable vip |  | active l'effet VIP. Réécris la commande pour le désactiver. | yes |
| :nomimic |  | te protège du vol d'apparence. | no |
| :userinfo | pseudo | affiche les informations sur le joueur cible. | yes |
| :smack | pseudo | embrasse la cible de cette commande. | no |
| :kill | pseudo | tue le joueur cible. | yes |
| :hit | pseudo | frappe et pousse la cible. Nécessite que [pushmode] soit activé. | no |
| :pete |  | ton avatar pète. | no |
| :boude |  | ton avatar boude. | no |
