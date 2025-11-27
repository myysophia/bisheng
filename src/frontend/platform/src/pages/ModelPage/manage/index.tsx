import { SettingIcon } from "@/components/bs-icons"
import { Button } from "@/components/bs-ui/button"
import { Switch } from "@/components/bs-ui/switch"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/bs-ui/table"
import { userContext } from "@/contexts/userContext"
import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
// import { transformModule, transformEvent, transformObjectType } from "../LogPage/utils"
import { useToast } from "@/components/bs-ui/toast/use-toast"
import { QuestionTooltip } from "@/components/bs-ui/tooltip"
import { changeLLmServerStatus, getAssistantModelList, getModelListApi } from "@/controllers/API/finetune"
import { captureAndAlertRequestErrorHoc } from "@/controllers/request"
import { CircleMinus, CirclePlus } from "lucide-react"
import ModelConfig from "./ModelConfig"
import SystemModelConfig from "./SystemModelConfig"
import { LoadingIcon } from "@/components/bs-icons/loading"
import { useQuery } from "react-query"

function CustomTableRow({ data, index, user, onModel, onCheck }) {
    // 使用模型与基础命名空间，保证中文模式下文案正确显示
    const { t } = useTranslation(['model', 'bs'])
    const [expand, setExpand] = useState(false)

    return <div className="text-sm bs-table-row">
        <div className={`grid grid-cols-2 transition-colors hover:bg-muted/50 items-center mt-1 mx-2 h-[52px] rounded-sm`}>
            <div className="bs-table-td h-full p-2 flex items-center gap-x-3 first:rounded-l-md last:rounded-r-md font-medium">
                {
                    expand ?
                        <CircleMinus className="cursor-pointer min-w-4 w-4 h-4" onClick={() => setExpand(false)} />
                        : <CirclePlus onClick={() => setExpand(true)} className="cursor-pointer min-w-4 w-4 h-4" />
                }
                {data.name}
            </div>
            <div className="bs-table-td h-full p-2 flex justify-end items-center gap-x-3 first:rounded-l-md last:rounded-r-md font-medium">
                <Button variant="link" onClick={() => onModel(data.id)}
                    disabled={user.role !== 'admin'}
                    className={`link px-0 pl-6`}>
                    {t('modelConfiguration')}
                </Button>
            </div>
        </div>
        {
            expand && <div className="px-12 py-2 m-auto border-collapse">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">{t('modelName')}</TableHead>
                            <TableHead className="w-[200px] min-w-[100px]">{t('modelType')}</TableHead>
                            <TableHead className="w-[200px] min-w-[100px]">{t('status')}</TableHead>
                            <TableHead className="w-[100px] min-w-[100px]">{t('onlineOfflineOperation')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.models.map(m => (
                            <TableRow key={m.id}>
                                <TableCell>{m.model_name}</TableCell>
                                <TableCell>{m.model_type}</TableCell>
                                <TableCell>
                                    <span className={['text-green-500', 'text-orange-500', 'text-gray-500'][m.status]}>
                                        {[t('available'), t('abnormal'), t('unknown')][m.status]}
                                    </span>
                                    {m.status === 1 && <QuestionTooltip className=" align-middle" content={m.remark} />}
                                </TableCell>
                                <TableCell>
                                    <Switch disabled={user.role !== 'admin'} checked={m.online} onCheckedChange={(bool) => onCheck(index, bool, m.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {!data.models.length && <TableFooter>
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-gray-400">{t('empty')}</TableCell>
                        </TableRow>
                    </TableFooter>}
                </Table>
            </div>
        }
    </div >
}

export default function Management() {
    // 使用模型与基础命名空间，保证中文模式下文案正确显示
    const { t, i18n } = useTranslation(['model', 'bs']);
    useEffect(() => {
        i18n.loadNamespaces(['model', 'bs']);
    }, [i18n]);

    const [data, setData] = useState([])
    const { user } = useContext(userContext)
    const [modelId, setModelId] = useState(null)
    const [systemModel, setSystemModel] = useState(false)
    const [loading, setLoading] = useState(false)
    const { refetch } = useAssistantLLmModel()

    const reload = async () => {
        setLoading(true)
        setData(await getModelListApi())
        setLoading(false)
    }
    useEffect(() => { reload() }, [])

    const handleGetRepeatName = (name) => {
        let index = 0
        let nameIndex = ''
        data.forEach(el => {
            if (el.name.indexOf(name) === 0) {
                const match = el.name.match(/\d+$/)
                const num = match ? match[0] : 0
                index = Math.max(index, Number(num))
                nameIndex = ` ${index + 1}`
            }
        })
        return `${name}${nameIndex}`
    }
    const { message } = useToast()

    // off&online
    const handleCheck = (index, bool, id) => {
        captureAndAlertRequestErrorHoc(changeLLmServerStatus(id, bool).then(res => {
            refetch()
        }))
        data[index].models = data[index].models.map(el => el.id === id ? { ...el, online: bool } : el)
        setData([...data])
    }

    if (modelId) return <ModelConfig
        id={modelId}
        onGetName={handleGetRepeatName}
        onBack={() => setModelId(null)}
        onReload={reload}
        onBerforSave={(id, name) => data.some(el => el.name === name && el.id !== id)}
        onAfterSave={(msg) => {
            message({ variant: 'success', description: msg })
            reload()
        }}
    />

    if (systemModel) return <SystemModelConfig data={data} onBack={() => setSystemModel(false)} />

    return <div className="relative bg-background-login h-full px-2 py-4">
        {loading && (
            <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.6)] dark:bg-blur-shared">
                <LoadingIcon />
            </div>
        )}
        <div className="h-full overflow-y-auto">
            <div className="flex justify-end gap-4">
                {user.role === 'admin' && <Button className="text-red-500" onClick={() => setSystemModel(true)} variant="secondary">
                    <SettingIcon className="text-red-500" />
                    {t('systemModelSettings')}
                </Button>}
                {user.role === 'admin' && <Button onClick={() => setModelId(-1)}>{t('addModel')}</Button>}
                <Button className="bg-black-button" onClick={reload}>{t('refresh')}</Button>
            </div>
            <div className="h-[85%]">
                <div className="flex h-10 justify-between items-center font-medium text-muted-foreground text-sm">
                    <span className="ml-5">{t('serviceProvider')}</span>
                    <span className="mr-5">{t('actions')}</span>
                </div>
                <div className="pb-20">
                    {
                        data.map((d, index) => <CustomTableRow
                            key={d.id}
                            user={user}
                            data={d}
                            index={index}
                            onCheck={handleCheck}
                            onModel={setModelId}
                        />)
                    }
                </div>
            </div>
        </div>
        <div className="bisheng-table-footer bg-background-login px-6">
            <p className="desc">{t('modelCollectionCaption')}.</p>
        </div>
    </div>

}


export function useAssistantLLmModel() {

    const { data, refetch } = useQuery({
        queryKey: "QueryModelsKey",
        queryFn: () => getModelListApi(),
        select: (data) => {
            const llmOptions = []
            const embeddings = []
            data.forEach(server => {
                const serverEmbItem = { value: server.id, label: server.name, children: [] }
                const serverLlmItem = { value: server.id, label: server.name, children: [] }
                server.models.forEach(model => {
                    const item = {
                        value: String(model.id),
                        label: model.model_name
                    }
                    if (!model.online) return

                    model.model_type === 'embedding' ?
                        serverEmbItem.children.push(item) : serverLlmItem.children.push(item)
                })

                if (serverLlmItem.children.length) llmOptions.push(serverLlmItem)
                if (serverEmbItem.children.length) embeddings.push(serverEmbItem)
            });

            return [llmOptions, embeddings]; // 返回选择的结果
        }
    });

    const [llmOptions, embeddings] = data ?? [[], []];
    return {
        llmOptions,
        embeddings,
        refetch
    }
}
