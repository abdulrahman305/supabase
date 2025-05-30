import { Transition } from '@headlessui/react'
import { useParams } from 'common'
import { map as lodashMap, uniqBy } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, SidePanel } from 'ui'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'
import SqlEditor from 'components/ui/SqlEditor'
import {
  useDatabaseFunctionsQuery,
  type DatabaseFunction,
} from 'data/database-functions/database-functions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { ChevronDown, HelpCircle, Terminal } from 'lucide-react'

export interface ChooseFunctionFormProps {
  visible: boolean
  setVisible: (value: boolean) => void
  onChange: (fn: DatabaseFunction) => void
}

const ChooseFunctionForm = ({ visible, onChange, setVisible }: ChooseFunctionFormProps) => {
  const project = useSelectedProject()

  const { data = [] } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const triggerFunctions = data.filter((fn) => fn.return_type === 'trigger')
  const hasPublicSchemaFunctions = triggerFunctions.length >= 1
  const functionSchemas = lodashMap(uniqBy(triggerFunctions, 'schema'), 'schema')

  const selectFunction = (id: number) => {
    const fn = triggerFunctions.find((x) => x.id === id)
    if (!!fn) onChange(fn)
    setVisible(!visible)
  }

  return (
    <SidePanel
      size="large"
      header="Pick a function"
      visible={visible}
      onCancel={() => setVisible(!visible)}
      className="hooks-sidepanel"
    >
      <div className="py-6">
        {hasPublicSchemaFunctions ? (
          <div className="space-y-6">
            <NoticeBox />
            {functionSchemas.map((schema: string) => (
              <SchemaFunctionGroup
                key={schema}
                schema={schema}
                functions={triggerFunctions.filter((x) => x.schema == schema)}
                selectFunction={selectFunction}
              />
            ))}
          </div>
        ) : (
          <NoFunctionsState />
        )}
      </div>
    </SidePanel>
  )
}

export default ChooseFunctionForm

const NoticeBox = () => {
  const { ref } = useParams()

  return (
    <div className="px-6">
      <InformationBox
        icon={<HelpCircle size="20" strokeWidth={1.5} />}
        title="Only functions that return a trigger will be displayed below"
        description={`You can make functions by using the Database Functions`}
        button={
          <Button asChild type="default">
            <Link href={`/project/${ref}/database/functions`}>Go to Functions</Link>
          </Button>
        }
      />
    </div>
  )
}

const NoFunctionsState = () => {
  // for the empty 'no tables' state link
  const router = useRouter()
  const { ref } = router.query

  return (
    <ProductEmptyState
      title="No Trigger Functions found in database"
      ctaButtonLabel="Create a trigger function"
      onClickCta={() => {
        router.push(`/project/${ref}/database/functions`)
      }}
    >
      <p className="text-sm text-foreground-light">
        You will need to create a trigger based function before you can add it to your trigger.
      </p>
    </ProductEmptyState>
  )
}

export interface SchemaFunctionGroupProps {
  schema: string
  functions: DatabaseFunction[]
  selectFunction: (id: number) => void
}

const SchemaFunctionGroup = ({ schema, functions, selectFunction }: SchemaFunctionGroupProps) => {
  return (
    <div className="space-y-4">
      <div className="sticky top-0 flex items-center space-x-1 px-6 backdrop-blur backdrop-filter">
        <h5 className="text-foreground-light">schema</h5>
        <h5>{schema}</h5>
      </div>
      <div className="space-y-0 divide-y border-t border-b border-default">
        {functions.map((x) => (
          <Function
            id={x.id}
            key={x.id}
            completeStatement={x.complete_statement}
            name={x.name}
            onClick={selectFunction}
          />
        ))}
      </div>
    </div>
  )
}

export interface FunctionProps {
  id: number
  completeStatement: string
  name: string
  onClick: (id: number) => void
}

const Function = ({ id, completeStatement, name, onClick }: FunctionProps) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="cursor-pointer rounded p-3 px-6 hover:bg-studio" onClick={() => onClick(id)}>
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center rounded bg-foreground p-1 text-background">
            <Terminal strokeWidth={2} size={14} />
          </div>
          <p className="mb-0 text-sm">{name}</p>
        </div>
        <Button
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            setVisible(!visible)
          }}
          icon={<ChevronDown className={visible ? 'rotate-180 transform' : 'rotate-0 transform'} />}
        >
          {visible ? 'Hide definition' : 'View definition'}
        </Button>
      </div>
      <Transition
        show={visible}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0"
        enterTo="transform opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100"
        leaveTo="transform opacity-0"
      >
        <div className="mt-4 h-64 border border-default">
          <SqlEditor defaultValue={completeStatement} readOnly={true} contextmenu={false} />
        </div>
      </Transition>
    </div>
  )
}
