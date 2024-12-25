import state from '@/js/utils/state'

const admin = state({
  editMode: false,
})

export const toggleEditMode = () => {
  admin.assign({ editMode: !admin.value.editMode })
}

export default admin
