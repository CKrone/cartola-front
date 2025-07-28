<script setup>
import { ref, computed, onMounted } from 'vue'
import CryptoJS from 'crypto-js'
import supabase from '@/supaBaseClient.js'

const players = ref([
    { id: 1, name: 'Cassiano', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 },
    { id: 2, name: 'Cristian', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 },
    { id: 3, name: 'Jean', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 },
    { id: 4, name: 'Jhony', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 },
    { id: 5, name: 'Paulo', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 },
    { id: 6, name: 'Valdir', wins: 0, lastRoundPoints: 0, totalPoints: 0, valuePerRound: 0, valueTotal: 0, pointsToNext: 0, pointsToLeader: 0 }
])

let loading = ref(false)

const codeInput = ref('')
const isCodeValid = ref(false)
const BONIFICACAO_PRIMEIRO_COLOCADO = 200
const BONIFICACAO_SEGUNDO_COLOCADO = 130
const BONIFICACAO_TERCEIRO_COLOCADO = 80
const checkCodeValidity = async () => {
    const inputHash = CryptoJS.SHA256(codeInput.value).toString(CryptoJS.enc.Hex)

    try {
        const { data, error } = await supabase
            .from('user_access')
            .select('key_hash')
            .eq('key_hash', inputHash)
            .single()

        if (error) {
            console.error('Erro ao verificar o código:', error)
            isCodeValid.value = false
        } else if (data) {
            isCodeValid.value = true
        } else {
            isCodeValid.value = false
        }
    } catch (err) {
        console.error('Erro ao consultar Supabase:', err)
        isCodeValid.value = false
    }
}

const sortedPlayers = computed(() => {
    return [...players.value]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((player, index) => ({ ...player, position: index + 1 }))
})

const headers = [
    { title: 'Posição', key: 'position' },
    { title: 'Nome', key: 'name' },
    { title: 'Vitórias', key: 'wins' },
    { title: 'Última Rodada', key: 'lastRoundPoints' },
    { title: 'Pontuação Total', key: 'totalPoints' },
    { title: 'Pontos Até o Próximo ', key: 'pointsToNext' },
    { title: 'Pontos Até o Líder', key: 'pointsToLeader' },
    { title: 'Valor Ganho Por Rodada', key: 'valuePerRound' },
    { title: 'Total Premiação', key: 'valueTotal' }
]

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

const updateAllPlayersStats = (roundPointsList) => {
    const points = roundPointsList.map(point => parseFloat(point))

    players.value.forEach((player, index) => {
        player.lastRoundPoints = points[index]
        player.totalPoints += points[index]
    })

    const maxRoundPoints = Math.max(...points)
    players.value.forEach((player, index) => {
        if (points[index] === maxRoundPoints) {
            player.wins += 1
            player.valuePerRound += 5
        }
    })

    players.value.forEach(player => {
        player.valueTotal = calculateValueTotal(player)
    })
}

const calculateValueTotal = (player) => {
    const sortedByPoints = [...players.value].sort((a, b) => b.totalPoints - a.totalPoints)
    const rank = sortedByPoints.findIndex(p => p.name === player.name)
    let bonus = 0
    if (rank === 0) bonus = BONIFICACAO_PRIMEIRO_COLOCADO
    else if (rank === 1) bonus = BONIFICACAO_SEGUNDO_COLOCADO
    else if (rank === 2) bonus = BONIFICACAO_TERCEIRO_COLOCADO
    return parseFloat(player.valuePerRound) + bonus
}

const modalVisible = ref(false)
const roundPointsList = ref([])

const openModal = () => {
    roundPointsList.value = players.value.map(player => 0)
    modalVisible.value = true
}

const savePoints = () => {
    updateAllPlayersStats(roundPointsList.value)
    calculatePointsDifference(players)
    savePlayerData(players)
    modalVisible.value = false
}

const calculatePointsDifference = (players) => {
    const sorted = [...players.value].sort((a, b) => b.totalPoints - a.totalPoints)
    const leaderPoints = sorted[0]?.totalPoints || 0

    sorted.forEach((player, index) => {
        const currentPoints = player.totalPoints
        const nextPlayerPoints = sorted[index - 1]?.totalPoints

        player.pointsToLeader = parseFloat((leaderPoints - currentPoints).toFixed(2))
        player.pointsToNext = index === 0
            ? 0
            : parseFloat((nextPlayerPoints - currentPoints).toFixed(2))
    })

    players.value = players.value.map(p => {
        const updated = sorted.find(s => s.id === p.id)
        return updated ? { ...p, ...updated } : p
    })
}

const savePlayerData = async (players) => {
    try {
        const dataToSave = players.value.map(player => ({
            id: player.id,
            name: player.name,
            lastRoundPoints: player.lastRoundPoints,
            totalPoints: player.totalPoints,
            valuePerRound: player.valuePerRound,
            valueTotal: player.valueTotal,
            wins: player.wins
        }))

        const { error } = await supabase
            .from('cartola_2025')
            .upsert(dataToSave, { onConflict: ['id'] })

        if (error) throw error

        alert('Dados salvos com sucesso!')
    } catch (error) {
        alert('Erro ao salvar os dados')
    }
}

onMounted(async () => {
    loading.value = true
    try {
        const { data, error } = await supabase
            .from('cartola_2025')
            .select('*')

        if (error) throw error

        players.value = data.map(player => ({
            ...player,
            lastRoundPoints: player.lastRoundPoints || 0,
            totalPoints: player.totalPoints || 0,
            valuePerRound: player.valuePerRound || 0,
            valueTotal: player.valueTotal || 0,
            pointsToNext: player.pointsToNext || 0,
            pointsToLeader: player.pointsToLeader || 0,
            wins: player.wins || 0
        }))
    } catch (error) {
        alert('Erro ao carregar os dados dos jogadores.')
    }
    loading.value = false
})

</script>

<template>
    <v-container>
        <h2 class="text-center mb-4">Ranking dos Jogadores</h2>
        <v-data-table
            :loading="loading"
            :headers="headers"
            :items="sortedPlayers"
            density="compact"
            class="elevation-2"
            :items-per-page-options="[10,15,25]"
            :hide-default-footer="true"
        >
            <template v-slot:item.valuePerRound="{ item }">
                <span>{{ formatCurrency(item.valuePerRound) }}</span>
            </template>
            <template v-slot:item.valueTotal="{ item }">
                <span>{{ formatCurrency(item.valueTotal) }}</span>
            </template>
            <template v-slot:item.pointsToNext="{ item }">
                {{ item.pointsToNext.toFixed(2) }}
            </template>
            <template v-slot:item.pointsToLeader="{ item }">
                {{ item.pointsToLeader.toFixed(2) }}
            </template>
            <template v-slot:item.totalPoints="{ item }">
                {{ item.totalPoints.toFixed(2) }}
            </template>
            <template v-slot:item.lastRoundPoints="{ item }">
                {{ item.lastRoundPoints.toFixed(2) }}
            </template>
        </v-data-table>
        <v-text-field
            v-if="!isCodeValid"
            v-model="codeInput"
            label="Digite o código para liberar o botão"
            type="text"
            @input="checkCodeValidity"
        ></v-text-field>
        <v-btn @click="openModal" class="mt-5" :disabled="!isCodeValid">Adicionar Pontuação</v-btn>
        <v-dialog v-model="modalVisible" max-width="400px">
            <v-card>
                <v-card-title class="headline">Adicionar Pontuação</v-card-title>
                <v-card-text>
                    <v-text-field
                        v-for="(player, index) in players"
                        :key="player.name"
                        v-model="roundPointsList[index]"
                        :label="'Pontuação de ' + player.name"
                        type="number"
                        required
                    ></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="modalVisible = false" color="red">Cancelar</v-btn>
                    <v-btn @click="savePoints" color="green">Salvar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
